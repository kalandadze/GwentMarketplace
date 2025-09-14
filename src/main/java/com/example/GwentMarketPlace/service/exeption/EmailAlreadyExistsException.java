package com.example.GwentMarketPlace.service.exeption;

public class EmailAlreadyExistsException extends RuntimeException{
    public EmailAlreadyExistsException(String email) {
        super("email "+ email +" already exists");
    }
}
