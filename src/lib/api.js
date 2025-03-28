import axios from "axios"
import config from "Config"
const { apiurl, cors } = config

export default function ({ cmd, method = "GET", type = "json", data = {}, header = {}, fileList = [], fileObj = {} }) {
  method = method.toUpperCase()
  type = type.toLowerCase()
  let url = `${apiurl}/${cmd}`
  let option = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...header,
    },
  }

  if (fileList.length || Object.keys(fileObj)?.length > 0) {
    let formData = new FormData()
    option.headers["Content-Type"] = "multipart/form-data"
    let filelist = [...fileList]
    filelist.forEach((file) => {
      formData.append("files", file)
    })
    Object.keys(fileObj)?.map((key) => {
      if (Array.isArray(fileObj[key])) {
        let list_arr = [...fileObj[key]]
        list_arr.forEach((file) => {
          file !== null && formData.append(key, file)
        })
      }
      else
        file !== null && formData.append(key, fileObj[key])
    })
    Object.keys(data).map((key) => {
      formData.append(key, data[key])
    })
    data = formData
  }
  switch (method) {
    case "POST":
    case "PUT":
    case "DELETE":
      option.data = data
      break
    case "GET":
      option.params = data
      break
  }
  return axios({
    method,
    url,
    ...option,
    withCredentials: !!cors,
  })
    .then((res) => {
      return {
        ok: res.status == "200",
        status: res.status,
        body: res.data,
      }
    })
    .catch((err) => {
      let res = err.response
      if (res) {
        return {
          ok: res.status == "200",
          status: res.status,
          body: res.data,
        }
      } else {
        throw new Error({
          ok: false,
          status: 404,
          body: err.message,
        })
      }
    })
}
