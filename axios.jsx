import axios, { AxiosError } from "axios";
import {
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "../store/reducers/ConfirmSms";
import { apiUrl } from "./apiRoutes/apiRoutes";

const Axios = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}`,
});

let refreshRequest: any = null;

Axios.interceptors.request.use(
  function (config: any) {
    const access_token = getToken();
    config.headers["token"] = access_token;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

Axios.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    if (error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    } else if (error.response.status === 403) {
      if (!refreshRequest) {
        refreshRequest = sendRefreshRequest();
      }
      await refreshRequest;
      const access_token = getToken();
      if (access_token) {
        return Axios(error.config);
      }
      refreshRequest = null;
    }

    return Promise.reject(error);
  }
);

function sendRefreshRequest() {
  const token = getToken();
  const refreshToken: any = getRefreshToken();
  return Axios(apiUrl.refReshToken, {
    method: "POST",
    headers: {
      refreshToken: refreshToken,
    },
  })
    .then(function (response) {
      const { data } = response;
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      const access_token = getToken();
      Axios.defaults.headers.common["token"] = access_token;
      refreshRequest = null;
    })
    .catch(function (error) {
      localStorage.removeItem("token");
      // also you can do something...
    });
}

export { Axios };