package com.example.GwentMarketPlace.service.exeption;

public class EmailInvalidException extends RuntimeException{
    public EmailInvalidException(String email) {
        super("email - "+email+" does not exist");
    }
}
