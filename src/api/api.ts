import axios from 'axios'

const api = await axios.create({
  baseURL: 'http://localhost:4000/api',
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api
