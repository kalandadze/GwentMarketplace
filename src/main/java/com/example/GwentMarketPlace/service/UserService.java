package com.example.GwentMarketPlace.service;

import com.example.GwentMarketPlace.dto.CardDto;
import com.example.GwentMarketPlace.dto.UserDto;
import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.model.User;
import com.example.GwentMarketPlace.repository.CardRepository;
import com.example.GwentMarketPlace.repository.UserRepository;
import com.example.GwentMarketPlace.service.exeption.IncorrectPasswordException;
import com.example.GwentMarketPlace.util.JwtUtils;

import static com.example.GwentMarketPlace.util.ModelConverter.*;

import com.example.GwentMarketPlace.util.UserValidator;
import jakarta.persistence.EntityNotFoundException;
import org.antlr.v4.runtime.misc.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {
  private final UserRepository repository;
  private final CardRepository cardRepository;
  private final BCryptPasswordEncoder passwordEncoder;
  private final UserValidator validator;

  @Autowired
  public UserService(UserRepository userRepository, CardRepository cardRepository, BCryptPasswordEncoder passwordEncoder, UserValidator validateUser) {
    this.repository = userRepository;
    this.cardRepository = cardRepository;
    this.passwordEncoder = passwordEncoder;
    this.validator = validateUser;
  }


  public User getUserByEmail(String email) {
    return repository.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("user with email - " + email + " does not exist"));
  }

  public void register(String username, String email, String password) {
    User user = User.builder()
      .email(email)
      .username(username)
      .password(passwordEncoder.encode(password))
      .balance(10000L)
      .collection(new ArrayList<>())
      .build();
    validator.validateUser(user, repository.findByEmail(email).isPresent());
    repository.save(user);
  }

  public Pair<UserDto, String> login(String email, String password) {
    User user = getUserByEmail(email);
    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new IncorrectPasswordException();
    }
    return new Pair<>(convert(user), JwtUtils.generateToken(email));
  }

  public List<CardDto> getCollectionByEmail(String email) {
    List<Card> cards = getUserByEmail(email).getCollection();
    return convertCards(cards);
  }

  public Long getBalance(String mail) {
    return getUserByEmail(mail).getBalance();
  }
}
