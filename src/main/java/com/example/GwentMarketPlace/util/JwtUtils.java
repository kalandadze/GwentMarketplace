package com.example.GwentMarketPlace.util;

import com.example.GwentMarketPlace.service.exeption.TokenExpiredException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtils {

  public static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

  @Value("${jwt.header}")
  public static final String JWT_HEADER = "Authorization";

  @Value("${jwt.secret}")
  public static String JWT_SECRET="21D4332AC2C2E7C4E5C0579E8FB788E51987C61F18362BFC14E0D0550BEF5A2D";

  public static String generateToken(String email) {
    return Jwts.builder()
      .setSubject(email)
      .setIssuedAt(new Date())
      .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
      .signWith(SignatureAlgorithm.HS256, JWT_SECRET)
      .compact();
  }

  private static Claims getAllClaimsFromToken(String token) {
    return Jwts.parser().setSigningKey(JWT_SECRET).parseClaimsJws(token).getBody();
  }

  private static String getEmailFromToken(String token) {
    return getAllClaimsFromToken(token).getSubject();
  }

  private static Date getExpirationDateFromToken(String token) {
    return getAllClaimsFromToken(token).getExpiration();
  }

  private static Boolean isTokenExpired(String token) {
    return getExpirationDateFromToken(token).before(new Date());
  }

  public static String validateToken(String token) {
    if (isTokenExpired(token)) throw new TokenExpiredException();
    return getEmailFromToken(token);
  }

}
