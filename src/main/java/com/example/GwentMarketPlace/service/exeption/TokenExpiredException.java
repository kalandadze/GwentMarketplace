package com.example.GwentMarketPlace.service.exeption;

public class TokenExpiredException extends RuntimeException {
  public TokenExpiredException() {
    super("Session expired. Please login again.");
  }
}
