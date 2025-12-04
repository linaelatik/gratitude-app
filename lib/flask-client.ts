// lib/flask-client.ts
// Replace your Supabase client with this Flask API client

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

class FlaskClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      console.log('Constructor - token found:', !!this.token) // Debug
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

  // Auth object to match Supabase interface
  auth = {
    signUp: async ({ email, password, options }: { 
      email: string; 
      password: string; 
      options?: { data?: { display_name?: string } }
    }) => {
      try {
        const data = await this.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            display_name: options?.data?.display_name,
          }),
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
        // Token might be expired
        this.token = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        return { data: { user: null }, error: { message: error.message } }
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
          console.log('Token saved:', data.token) // Debug
        }
    
        return { data: { user: data.user }, error: null }
      } catch (error: any) {
        return { data: null, error: { message: error.message } }
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

  // Entries methods
  async from(table: string) {
    return new TableClient(table, this)
  }

  // Direct methods for common operations
  async getEntries(userId: string) {
    return this.request('/entries')
  }

  async createEntry(content: string) {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async deleteEntry(entryId: string) {
    return this.request(`/entries/${entryId}`, {
      method: 'DELETE',
    })
  }

  async getDashboardStats() {
    return this.request('/dashboard/stats')
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

  async updateProfile(displayName: string) {
    return this.request('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify({ display_name: displayName }),
    })
  }

  async getEmailPreferences() {
    return this.request('/settings/email-preferences')
  }

  async updateEmailPreferences(weeklySummary: boolean) {
    return this.request('/settings/email-preferences', {
      method: 'PUT',
      body: JSON.stringify({ weekly_summary: weeklySummary }),
    })
  }
}

class TableClient {
  constructor(private table: string, private client: FlaskClient) {}

  select(columns: string = '*') {
    return new QueryBuilder(this.table, this.client, columns)
  }

  insert(data: any) {
    return {
      async execute() {
        if (this.table === 'entries') {
          return this.client.createEntry(data.content)
        }
        // Add other table inserts as needed
        throw new Error(`Insert not implemented for table: ${this.table}`)
      }
    }
  }

  delete() {
    return new QueryBuilder(this.table, this.client, '*', 'DELETE')
  }

  update(data: any) {
    return new QueryBuilder(this.table, this.client, '*', 'UPDATE', data)
  }
}

class QueryBuilder {
  private filters: any[] = []
  private orderBy: any = null
  private limitCount: number | null = null

  constructor(
    private table: string,
    private client: FlaskClient,
    private columns: string = '*',
    private operation: string = 'SELECT',
    private updateData?: any
  ) {}

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  async execute() {
    // For now, map common queries to API endpoints
    // This is a simplified implementation
    
    if (this.table === 'entries') {
      if (this.operation === 'SELECT') {
        return { data: await this.client.getEntries(''), error: null }
      } else if (this.operation === 'DELETE') {
        // You'll need to pass the entry ID somehow
        throw new Error('Delete operation needs entry ID')
      }
    }
    
    // Add more table/operation mappings as needed
    throw new Error(`Operation not implemented: ${this.operation} on ${this.table}`)
  }

  // Alias for execute() to match Supabase API
  async single() {
    return this.execute()
  }
}

// Create the client instance
export const flaskClient = new FlaskClient()

// For backwards compatibility, you can also export it as supabase
export { flaskClient as supabase }