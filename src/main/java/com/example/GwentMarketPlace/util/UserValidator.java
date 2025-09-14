package com.example.GwentMarketPlace.util;

import com.example.GwentMarketPlace.model.User;
import com.example.GwentMarketPlace.service.exeption.EmailAlreadyExistsException;
import com.example.GwentMarketPlace.service.exeption.EmailInvalidException;
import com.example.GwentMarketPlace.service.exeption.UsernameInvalidException;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class UserValidator {

  private static final Pattern USER_USERNAME = Pattern.compile("^[a-zA-Z]{2,50}$");

  public boolean validateUserUsername(String username) {
    return USER_USERNAME.matcher(username).matches();
  }

  public boolean validateUserEmail(String email) {
    try {
      InternetAddress emailAddress = new InternetAddress(email);
      emailAddress.validate();
      return true;
    } catch (AddressException e) {
      return false;
    }
  }

  public void validateUser(User user, boolean isPresent) {
    if (isPresent) {
      throw new EmailAlreadyExistsException(user.getEmail());
    }
    if (!validateUserEmail(user.getEmail())) {
      throw new EmailInvalidException(user.getEmail());
    } else if (!validateUserUsername(user.getUsername())) {
      throw new UsernameInvalidException(user.getUsername());
    }
  }
}
