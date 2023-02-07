import { serverSideEnv } from "@env";
import { decryptAccessToken } from "@src/services/auth/index.server.js";
import { PATH } from "./implementation.js";
import express from "express";

/**
 * Routes for the GitHub service.
 *
 * Proxies requests and adds the authorization header.
 */
export const router = express.Router();

const env = await serverSideEnv();

// matching all routes after the path with '*'
// and proxying the request to the GitHub API
router.all(PATH + "*", async (request, response, next) => {
  try {
    const encryptedAccessToken = request.session?.encryptedAccessToken;
    const decryptedAccessToken = await decryptAccessToken({
      JWE_SECRET_KEY: env.JWE_SECRET_KEY,
      jwe: encryptedAccessToken,
    });
    // slicing the path to remove the path prefix
    const res = await fetch(request.url.slice(PATH.length), {
      method: request.method,
      headers: {
        // set the authorization header (must be base64 encoded)
        authorization: `Basic ${btoa(decryptedAccessToken)}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: request.body,
    });
    if (res.headers.get("content-type")?.includes("json")) {
      response
        .status(res.status)
        .contentType(res.headers.get("content-type")!)
        .send(await res.json());
    } else {
      response.status(res.status).send(res.body);
    }
  } catch (error) {
    next(error);
  }
});