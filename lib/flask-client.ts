// lib/flask-client.ts

const API_BASE = 'http://localhost:5001/api'

/**
 * HTTP client for communicating with the Flask backend.
 * Handles auth token storage and attaches Bearer tokens to all requests.
 */
class FlaskClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  }

  auth = {
    /** Register a new user and store the returned JWT. */
    signUp: async ({ email, password, display_name }: {
      email: string
      password: string
      display_name?: string
    }) => {
      try {
        const data = await this.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, display_name }),
        })

        this.token = data.token
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token)
        }

        return { data: { user: data.user }, error: null }
      } catch (error: any) {
        return { data: null, error: { message: error.message } }
      }
    },

    /** Authenticate an existing user and store the returned JWT. */
    signInWithPassword: async ({ email, password }: {
      email: string
      password: string
    }) => {
      try {
        const data = await this.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })

        this.token = data.token
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token)
        }

        return { data: { user: data.user }, error: null }
      } catch (error: any) {
        return { data: null, error: { message: error.message } }
      }
    },

    /** Return the currently authenticated user, or null if no valid token exists. */
    getUser: async () => {
      if (!this.token) {
        return { data: { user: null }, error: null }
      }

      try {
        const data = await this.request('/auth/me')
        return { data: { user: data.user }, error: null }
      } catch (error: any) {
        // Token is invalid or expired — clear it
        this.token = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        return { data: { user: null }, error: { message: error.message } }
      }
    },

    /** Clear the stored token and log the user out. */
    signOut: async () => {
      this.token = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
      return { error: null }
    },
  }

  /** Create a new gratitude journal entry. */
  async createEntry(content: string) {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  /** Fetch all journal entries for the authenticated user. */
  async getEntries() {
    return this.request('/entries')
  }

  /** Delete a specific journal entry by ID. */
  async deleteEntry(entryId: string) {
    return this.request(`/entries/${entryId}`, {
      method: 'DELETE',
    })
  }

  /** Generate a safety-aware AI reflection based on a stressor input. */
  async generateStressReflection(stressor: string) {
    return this.request('/stress-relief/generate', {
      method: 'POST',
      body: JSON.stringify({ stressor }),
    })
  }

  /** Fetch the history of all past stress relief interactions. */
  async getStressReflectionHistory() {
    return this.request('/stress-relief/history')
  }
}

export const flaskClient = new FlaskClient()