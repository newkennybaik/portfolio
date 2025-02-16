package com.mysql.jwt.demo.util;

import java.util.Base64;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

public class JwtKeyGenerator {
    public static void main(String[] args) {
        SecretKey key = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
        String base64Key = Base64.getEncoder().encodeToString(key.getEncoded());
        System.out.println("Generated Base64 Secret Key: " + base64Key);
    }
}
