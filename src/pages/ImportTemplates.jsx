import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, apiBlob } from "../lib/api";
import "./import-templates.css";

const FIELD_TYPES = [
  {
    value: "",
    label: "Ignore this column",
  },
  {
    value: "DATE",
    label: "Transaction Date",
  },
  {
    value: "DESCRIPTION",
    label: "Description",
  },
  {
    value: "REFERENCE",
    label: "Reference",
  },
  {
    value: "VALUE_DATE",
    label: "Value Date",
  },
  {
    value: "DEBIT",
    label: "Debit",
  },
  {
    value: "CREDIT",
    label: "Credit",
  },
  {
    value: "BALANCE",
    label: "Balance",
  },
];

const REQUIRED_FIELDS = [
  "DATE",
  "DESCRIPTION",
];

export default function ImportTemplates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingId = searchParams.get("pendingId") || "";

  const [file, setFile] = useState(null);
  const [statementPassword, setStatementPassword] = useState("");

  const [templateName, setTemplateName] =
    useState("");

  const [columns, setColumns] =
    useState([]);

  const [mapping, setMapping] =
    useState({});

  const [previewRows, setPreviewRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [pendingQueue, setPendingQueue] = useState([]);
  const [activePendingId, setActivePendingId] = useState(pendingId);

  useEffect(() => {
    api("/imports/pending")
      .then((rows) => setPendingQueue(Array.isArray(rows) ? rows : []))
      .catch(() => setPendingQueue([]));
  }, []);


  /* =========================================================
     FILE UPLOAD
     ========================================================= */

  const handleFileChange = async (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess("");

    /*
     * Automatically generate a template name
     * if the user has not entered one.
     */
    if (!templateName.trim()) {
      const name =
        selectedFile.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]+/g, " ");

      setTemplateName(
        `${name} Template`
      );
    }

    await analyzeFile(selectedFile, statementPassword);
  };


  /* =========================================================
     ANALYZE FILE
     ========================================================= */

  const analyzeFile = async (
    selectedFile,
    pdfPassword = statementPassword
  ) => {
    setLoading(true);
    setError("");

    try {
      const body =
        new FormData();

      body.append(
        "file",
        selectedFile
      );

      if (pdfPassword && pdfPassword.trim()) {
        body.append(
          "statementPassword",
          pdfPassword.trim()
        );
      }

      /*
       * Backend endpoint:
       *
       * POST /api/import-templates/analyze
       *
       * It should return:
       *
       * {
       *   columns: [],
       *   rows: []
       * }
       */

      const result =
        await api(
          "/import-templates/analyze",
          {
            method: "POST",
            body,
          }
        );

      const detectedColumns =
        Array.isArray(
          result?.columns
        )
          ? result.columns
          : [];

      const rows =
        Array.isArray(
          result?.rows
        )
          ? result.rows
          : [];

      setColumns(
        detectedColumns
      );

      setPreviewRows(
        rows
      );

      /*
       * Automatically map common bank columns.
       */
      const automaticMapping =
        {};

      detectedColumns.forEach(
        (column) => {
          const normalized =
            String(column)
              .toLowerCase()
              .trim();

          let type = "";

          if (
            normalized === "date" ||
            normalized.includes(
              "transaction date"
            )
          ) {
            type = "DATE";
          } else if (
            normalized.includes(
              "narration"
            ) ||
            normalized.includes(
              "description"
            ) ||
            normalized.includes(
              "particular"
            )
          ) {
            type = "DESCRIPTION";
          } else if (
            normalized.includes(
              "ref"
            ) ||
            normalized.includes(
              "reference"
            )
          ) {
            type = "REFERENCE";
          } else if (
            normalized.includes(
              "value"
            ) &&
            normalized.includes(
              "date"
            )
          ) {
            type = "VALUE_DATE";
          } else if (
            normalized.includes(
              "withdraw"
            ) ||
            normalized.includes(
              "debit"
            ) ||
            normalized.includes(
              "dr"
            )
          ) {
            type = "DEBIT";
          } else if (
            normalized.includes(
              "deposit"
            ) ||
            normalized.includes(
              "credit"
            ) ||
            normalized.includes(
              "cr"
            )
          ) {
            type = "CREDIT";
          } else if (
            normalized.includes(
              "balance"
            ) ||
            normalized.includes(
              "closing"
            )
          ) {
            type = "BALANCE";
          }

          automaticMapping[
            column
          ] = type;
        }
      );

      setMapping(
        automaticMapping
      );
    } catch (e) {
      setError(
        e?.message ||
          "Unable to analyze the statement."
      );

      setColumns([]);
      setPreviewRows([]);
      setMapping({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pendingId) return undefined;
    let live = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const queue = await api("/imports/pending").catch(() => []);
        if (!live) return;
        const list = Array.isArray(queue) ? queue : [];
        setPendingQueue(list);
        const meta = list.find((row) => row.id === pendingId);
        const blob = await apiBlob(`/imports/pending/${pendingId}/content`);
        if (!live) return;
        const name = meta?.filename || `pending-statement-${pendingId}.bin`;
        const restored = new File([blob], name, { type: blob.type || "application/octet-stream" });
        setFile(restored);
        setActivePendingId(pendingId);
        setTemplateName((old) => old.trim() || `${name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ")} Template`);
        await analyzeFile(restored, statementPassword);
      } catch (e) {
        if (live) setError(e?.message || "Unable to load the statement waiting for format verification.");
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [pendingId]);


  /* =========================================================
     CHANGE MAPPING
     ========================================================= */

  const changeMapping = (
    column,
    type
  ) => {
    setMapping((old) => ({
      ...old,
      [column]: type,
    }));
  };


  /* =========================================================
     VALIDATE
     ========================================================= */

  const validate = () => {
    if (!templateName.trim()) {
      return "Enter a template name.";
    }

    if (!file) {
      return "Upload a bank statement first.";
    }

    if (!columns.length) {
      return "No statement columns were detected.";
    }

    for (
      const required of REQUIRED_FIELDS
    ) {
      const exists =
        Object.values(
          mapping
        ).includes(required);

      if (!exists) {
        return `Map one column to ${required}.`;
      }
    }

    const debit =
      Object.values(
        mapping
      ).includes("DEBIT");

    const credit =
      Object.values(
        mapping
      ).includes("CREDIT");

    if (!debit && !credit) {
      return "Map at least one column to Debit or Credit.";
    }

    return "";
  };


  /* =========================================================
     SAVE TEMPLATE
     ========================================================= */

  const saveTemplate = async () => {
    setError("");
    setSuccess("");

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    setSaving(true);

    try {
      const fields =
        Object.entries(
          mapping
        )
          .filter(
            ([, type]) =>
              Boolean(type)
          )
          .map(
            ([
              sourceColumn,
              type,
            ]) => ({
              type,
              sourceColumn,
            })
          );

      const saved = await api(
        "/import-templates",
        {
          method: "POST",

          body: JSON.stringify({
            name:
              templateName.trim(),

            active: true,

            fields,
          }),
        }
      );

      setSuccess(
        activePendingId
          ? "Format saved. Retrying the pending import…"
          : "Import template saved successfully."
      );

      setTimeout(() => {
        if (activePendingId && saved?.id) {
          navigate(
            `/transactions?pendingId=${encodeURIComponent(activePendingId)}&templateId=${encodeURIComponent(saved.id)}`
          );
        } else {
          navigate("/transactions");
        }
      }, 900);
    } catch (e) {
      setError(
        e?.message ||
          "Unable to save the import template."
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     MAPPING SUMMARY
     ========================================================= */

  const mappedFields =
    Object.entries(
      mapping
    ).filter(
      ([, type]) =>
        Boolean(type)
    );


  return (
    <section className="template-page">

      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="template-page-header">

        <div>

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
          >
            ← Transactions
          </button>

          <h1>
            Import Templates
          </h1>

          <p>
            Upload a sample bank statement
            and define how Prospr should
            interpret its columns.
            Unknown uploads waiting for verification appear below.
          </p>

        </div>

      </div>


      {/* =====================================================
          ERROR / SUCCESS
         ===================================================== */}

      {error && (
        <div className="template-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="template-alert success">
          {success}
        </div>
      )}

      {pendingQueue.length > 0 && (
        <div className="template-card">
          <div className="section-heading">
            <div className="step-number">!</div>
            <div>
              <h2>Needs format verification</h2>
              <p>These uploads could not be auto-mapped. Open one, map the columns, and save to retry import.</p>
            </div>
          </div>
          <div className="pending-list">
            {pendingQueue.map((item) => (
              <div className="pending-row" key={item.id}>
                <div>
                  <strong>{item.filename}</strong>
                  <p>{item.reason}</p>
                </div>
                <button
                  type="button"
                  className="save-button"
                  onClick={() => navigate(`/import-templates?pendingId=${item.id}`)}
                >
                  Update format
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePendingId && (
        <div className="template-alert success">
          Working on a queued statement. Map the columns below, then save to retry the import.
        </div>
      )}


      {/* =====================================================
          TEMPLATE NAME
         ===================================================== */}

      <div className="template-card">

        <div className="section-heading">

          <div className="step-number">
            1
          </div>

          <div>
            <h2>
              Template details
            </h2>

            <p>
              Give this statement format
              a name so you can reuse it.
            </p>
          </div>

        </div>


        <label>
          Template name
        </label>

        <input
          className="template-name-input"
          value={templateName}
          onChange={(event) =>
            setTemplateName(
              event.target.value
            )
          }
          placeholder="Example: HDFC Bank Statement"
        />

      </div>


      {/* =====================================================
          UPLOAD
         ===================================================== */}

      <div className="template-card">

        <div className="section-heading">

          <div className="step-number">
            2
          </div>

          <div>
            <h2>
              Upload sample statement
            </h2>

            <p>
              Upload the actual bank
              statement format you want
              to configure.
            </p>
          </div>

        </div>


        <label className="upload-box">

          <input
            type="file"
            accept=".csv,.xls,.xlsx,.pdf"
            onChange={
              handleFileChange
            }
          />

          <div className="upload-icon">
            ↑
          </div>

          <strong>
            {file
              ? file.name
              : "Choose a bank statement"}
          </strong>

          <span>
            CSV, XLS, XLSX or
            selectable-text PDF
          </span>

        </label>

        <label className="statement-password">
          PDF password
          <input
            type="password"
            value={statementPassword}
            autoComplete="off"
            placeholder="Only if the PDF is locked"
            onChange={(event) => setStatementPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && file) {
                event.preventDefault();
                analyzeFile(file, event.currentTarget.value);
              }
            }}
          />
        </label>

        {file && (
          <button
            className="save-button read-statement"
            type="button"
            disabled={loading}
            onClick={() => analyzeFile(file, statementPassword)}
          >
            {loading ? "Reading…" : "Read statement"}
          </button>
        )}


        {loading && (
          <div className="analyzing">
            Analyzing statement columns…
          </div>
        )}

      </div>


      {/* =====================================================
          COLUMN MAPPING
         ===================================================== */}

      {columns.length > 0 && (
        <div className="template-card">

          <div className="section-heading">

            <div className="step-number">
              3
            </div>

            <div>
              <h2>
                Map statement columns
              </h2>

              <p>
                Prospr detected these columns.
                Change the mapping if required.
              </p>
            </div>

          </div>


          <div className="mapping-list">

            {columns.map(
              (column) => (
                <div
                  className="mapping-row"
                  key={column}
                >

                  <div className="source-column">

                    <span>
                      Source column
                    </span>

                    <strong>
                      {column}
                    </strong>

                  </div>


                  <div className="mapping-arrow">
                    →
                  </div>


                  <div className="target-column">

                    <span>
                      Prospr field
                    </span>

                    <select
                      value={
                        mapping[
                          column
                        ] || ""
                      }
                      onChange={(
                        event
                      ) =>
                        changeMapping(
                          column,
                          event.target
                            .value
                        )
                      }
                    >

                      {FIELD_TYPES.map(
                        (field) => (
                          <option
                            key={
                              field.value
                            }
                            value={
                              field.value
                            }
                          >
                            {field.label}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>
              )
            )}

          </div>

        </div>
      )}


      {/* =====================================================
          PREVIEW
         ===================================================== */}

      {columns.length > 0 &&
        previewRows.length > 0 && (
          <div className="template-card">

            <div className="section-heading">

              <div className="step-number">
                4
              </div>

              <div>
                <h2>
                  Statement preview
                </h2>

                <p>
                  Verify that the detected
                  columns match the uploaded
                  statement.
                </p>
              </div>

            </div>


            <div className="statement-preview">

              <div className="preview-scroll">

                <table>

                  <thead>
                    <tr>
                      {columns.map(
                        (column) => (
                          <th
                            key={
                              column
                            }
                          >
                            {column}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>

                    {previewRows
                      .slice(0, 5)
                      .map(
                        (
                          row,
                          index
                        ) => (
                          <tr
                            key={
                              index
                            }
                          >

                            {columns.map(
                              (
                                column
                              ) => (
                                <td
                                  key={
                                    column
                                  }
                                >
                                  {row?.[
                                    column
                                  ] ??
                                    "—"}
                                </td>
                              )
                            )}

                          </tr>
                        )
                      )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>
        )}


      {/* =====================================================
          SAVED MAPPING
         ===================================================== */}

      {mappedFields.length > 0 && (
        <div className="template-card mapping-summary-card">

          <div className="section-heading">

            <div className="step-number">
              5
            </div>

            <div>
              <h2>
                Template mapping
              </h2>

              <p>
                This is how Prospr will
                interpret this statement.
              </p>
            </div>

          </div>


          <div className="mapping-summary">

            {mappedFields.map(
              ([
                source,
                target,
              ]) => {

                const targetLabel =
                  FIELD_TYPES.find(
                    (field) =>
                      field.value ===
                      target
                  )?.label ||
                  target;

                return (
                  <div
                    className="mapping-summary-row"
                    key={source}
                  >

                    <span>
                      {source}
                    </span>

                    <b>
                      →
                    </b>

                    <strong>
                      {targetLabel}
                    </strong>

                  </div>
                );
              }
            )}

          </div>


          {mapping.BALANCE && (
            <div className="template-warning">
              <strong>
                Important:
              </strong>{" "}
              Balance is used only as
              the account balance. It will
              never be treated as a
              transaction amount.
            </div>
          )}

        </div>
      )}


      {/* =====================================================
          SAVE
         ===================================================== */}

      {columns.length > 0 && (
        <div className="template-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "/transactions"
              )
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary"
            onClick={
              saveTemplate
            }
            disabled={
              saving ||
              loading
            }
          >
            {saving
              ? "Saving..."
              : "Save Template"}
          </button>

        </div>
      )}

    </section>
  );
}