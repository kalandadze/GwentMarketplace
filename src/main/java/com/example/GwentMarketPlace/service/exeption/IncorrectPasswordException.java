package com.example.GwentMarketPlace.service.exeption;

public class IncorrectPasswordException extends RuntimeException {
    public IncorrectPasswordException() {
        super("incorrect password");
    }
}
