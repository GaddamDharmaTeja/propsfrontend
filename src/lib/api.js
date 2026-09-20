const baseUrl =
  process.env.REACT_APP_API_URL ||
  "http://localhost:8080/api";


/* =========================================================
   API REQUEST
   ========================================================= */

export async function api(path, options = {}) {
  const token =
    localStorage.getItem("prospr_token");

  const headers = new Headers(
    options.headers || {}
  );

  /*
   * Detect FormData requests.
   *
   * IMPORTANT:
   * Do NOT set Content-Type manually for FormData.
   * The browser will automatically set:
   *
   * multipart/form-data;
   * boundary=----WebKitFormBoundary...
   */
  const isFormData =
    options.body instanceof FormData;


  /*
   * JSON requests
   */
  if (!isFormData) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }


  /*
   * Authentication
   */
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }


  /*
   * Make request
   */
  let response;

  try {
    response = await fetch(
      `${baseUrl}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      "Unable to connect to the Prospr server. Please make sure the backend is running on port 8080."
    );
  }


  /*
   * No Content
   */
  if (response.status === 204) {
    return null;
  }


  /*
   * Read response safely.
   *
   * Some APIs return JSON.
   * Some may return an empty response.
   * Some may return plain text.
   */
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let body = null;

  try {
    if (
      contentType.includes(
        "application/json"
      )
    ) {
      body =
        await response.json();
    } else {
      const text =
        await response.text();

      body = text
        ? text
        : null;
    }
  } catch {
    body = null;
  }


  /*
   * Handle HTTP errors
   */
  if (!response.ok) {

    let message =
      "Something went wrong. Please try again.";


    /*
     * Spring Boot usually returns:
     *
     * {
     *   "message": "...",
     *   "error": "..."
     * }
     */

    if (
      body &&
      typeof body === "object"
    ) {
      message =
        body.detail ||
        body.message ||
        body.error ||
        message;
    }


    /*
     * Plain text response
     */
    if (
      typeof body === "string" &&
      body.trim()
    ) {
      message = body;
    }


    /*
     * Specific HTTP messages
     */
    if (
      response.status === 400 &&
      (!body ||
        typeof body !== "object")
    ) {
      message =
        "Invalid request. Please check the information you entered.";
    }

    if (response.status === 401 && (!body || typeof body !== "object" || !body.message)) {
      message = "Your session has expired. Please log in again.";
    }

    if (response.status === 403) {
      message =
        "You do not have permission to perform this action.";
    }

    if (response.status === 404) {
      message =
        "The requested API endpoint was not found.";
    }

    if (response.status >= 500) {
      message =
        "The Prospr server encountered an error. Please try again.";
    }


    /*
     * Log useful information during development
     */
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.error(
        "API ERROR",
        {
          url: `${baseUrl}${path}`,
          status: response.status,
          response: body,
        }
      );
    }


    throw new Error(message);
  }


  /*
   * Successful request
   */
  return body;
}


/* =========================================================
   SAVE LOGIN SESSION
   ========================================================= */

export function setSession(session) {

  if (!session) {
    return;
  }


  /*
   * Save token
   */
  if (session.token) {
    localStorage.setItem(
      "prospr_token",
      session.token
    );
  }


  /*
   * Save user
   */
  if (session.user) {
    localStorage.setItem(
      "prospr_user",
      JSON.stringify(
        session.user
      )
    );
  }
}


/* =========================================================
   CLEAR LOGIN SESSION
   ========================================================= */

export function clearSession() {

  localStorage.removeItem(
    "prospr_token"
  );

  localStorage.removeItem(
    "prospr_user"
  );
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

export function currentUser() {

  try {

    const user =
      localStorage.getItem(
        "prospr_user"
      );

    if (!user) {
      return null;
    }

    return JSON.parse(user);

  } catch (error) {

    console.error(
      "Unable to read Prospr user session:",
      error
    );

    return null;
  }
}


/* =========================================================
   GET AUTH TOKEN
   ========================================================= */

export function getToken() {

  return localStorage.getItem(
    "prospr_token"
  );
}


/* =========================================================
   CHECK LOGIN STATUS
   ========================================================= */

export function isAuthenticated() {

  return Boolean(
    localStorage.getItem(
      "prospr_token"
    )
  );
}
