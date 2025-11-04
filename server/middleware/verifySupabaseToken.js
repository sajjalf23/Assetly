import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import dotenv from "dotenv";

dotenv.config();

let cachedKeys = null;

export const verifySupabaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Missing Token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Invalid Token Format" });
  }

  try {
    // Fetch JWKs only once
    if (!cachedKeys) {
      const resKeys = await fetch(`${process.env.SUPABASE_URL}/auth/v1/jwks`);
      const data = await resKeys.json();
      if (!data?.keys) {
        return res.status(500).json({ success: false, message: "Invalid JWK response" });
      }
      cachedKeys = data;
    }

    const decodedHeader = jwt.decode(token, { complete: true });
    const kid = decodedHeader?.header?.kid;

    if (!cachedKeys?.keys || cachedKeys.keys.length === 0) {
      return res.status(500).json({ success: false, message: "No JWK keys found" });
    }

    const jwk = cachedKeys.keys.find((k) => k.kid === kid) || cachedKeys.keys[0];

    if (!jwk) {
      return res.status(401).json({ success: false, message: "Unable to find JWK" });
    }

    const pem = jwkToPem(jwk);

    jwt.verify(token, pem, { algorithms: ["RS256"] }, (error, decoded) => {
      if (error) {
        return res.status(401).json({ success: false, error: "Token verification failed" });
      }
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("JWT verification error:", err);
    res.status(500).json({ success: false, error: "Token validation error" });
  }
};

// import jwt from "jsonwebtoken";
// import jwkToPem from "jwk-to-pem";
// import dotenv from "dotenv";

// dotenv.config();

// let cachedKeys = null;

// export const verifySupabaseToken = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader)
//     return res.status(401).json({ success: false, message: "Missing Token" });

//   const token = authHeader.split(" ")[1];
//   if (!token)
//     return res.status(401).json({ success: false, message: "Invalid Token Format" });

//   try {
//     // fetch JWK keys (cache them)
//     if (!cachedKeys) {
//       const resKeys = await fetch(`${process.env.SUPABASE_URL}/auth/v1/jwks`);
//       const data = await resKeys.json();
//       cachedKeys = data;
//     }

//     const decodedHeader = jwt.decode(token, { complete: true });
//     const kid = decodedHeader?.header?.kid;
//     const jwk = cachedKeys.keys.find((k) => k.kid === kid) || cachedKeys.keys[0];
//     const pem = jwkToPem(jwk);

//     jwt.verify(token, pem, { algorithms: ["RS256"] }, (error, decoded) => {
//       if (error)
//         return res.status(401).json({ success: false, error: "Token verification failed" });

//       req.user = decoded;
//       next();
//     });
//   } catch (err) {
//     console.error("JWT verification error:", err);
//     res.status(500).json({ success: false, error: "Token validation error" });
//   }
// };
