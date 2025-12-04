// lib/flask-client.ts
const API_BASE = 'http://localhost:5001/api'

class FlaskClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
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
    } catch (error) {
      throw error
    }
  }

  auth = {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const data = await this.request('/auth/register', {
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

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
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

    getUser: async () => {
      if (!this.token) {
        return { data: { user: null }, error: null }
      }

      try {
        const data = await this.request('/auth/me')
        return { data: { user: data.user }, error: null }
      } catch (error: any) {
        this.token = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        return { data: { user: null }, error: { message: error.message } }
      }
    },

    signOut: async () => {
      this.token = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
      return { error: null }
    }
  }

  // Direct methods for entries
  async createEntry(content: string) {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async getEntries() {
    return this.request('/entries')
  }

  async deleteEntry(entryId: string) {
    return this.request(`/entries/${entryId}`, {
      method: 'DELETE',
    })
  }
  async generateStressReflection(stressor: string) {
    return this.request('/stress-relief/generate', {
      method: 'POST',
      body: JSON.stringify({ stressor }),
    })
  }
  
  async getStressReflectionHistory() {
    return this.request('/stress-relief/history')
  }
}

export const supabase = new FlaskClient()