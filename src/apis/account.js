import api from '../lib/api'

export const getAccount = async () => {
  const response = await api({ method: "GET", cmd: "api/Member" })
  return response
}

export const logoutAccount = async () => {
  const response = await api({ method: "GET", cmd: "api/Auth/logout" })
  return response
}