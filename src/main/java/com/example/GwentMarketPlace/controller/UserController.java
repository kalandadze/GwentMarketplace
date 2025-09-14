package com.example.GwentMarketPlace.controller;

import com.example.GwentMarketPlace.dto.UserDto;
import com.example.GwentMarketPlace.service.UserService;
import com.example.GwentMarketPlace.util.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.antlr.v4.runtime.misc.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {
  private final UserService service;
  private final JwtUtils utils;
  @Autowired
  public UserController(UserService userService, JwtUtils utils) {
    this.service = userService;
    this.utils = utils;
  }

  @PostMapping("/register")
  @ResponseBody
  public ResponseEntity<?> register(@RequestParam("username") String username, @RequestParam("email") String email, @RequestParam("password") String password) {
    try {
      service.register(username, email, password);
      return ResponseEntity.status(HttpStatus.CREATED).build();
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
  }

  @GetMapping("/login")
  @ResponseBody
  public ResponseEntity<?> Login(@RequestParam("email") String email, @RequestParam("password") String password, HttpServletResponse response) {
    try {
      Pair<UserDto,String> userAndToken = service.login(email, password);
      Cookie cookie=new Cookie(JwtUtils.JWT_HEADER, userAndToken.b);
      cookie.setPath("/");
      response.addCookie(cookie);
      return ResponseEntity.status(HttpStatus.ACCEPTED).body(userAndToken.a);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
  }
  @GetMapping("/logout")
  @ResponseBody
  public ResponseEntity<?> Logout(@CookieValue(name = JwtUtils.JWT_HEADER) String token, HttpServletResponse response) {
    try {
      JwtUtils.validateToken(token);
      Cookie cookie = new Cookie(JwtUtils.JWT_HEADER, token);
      cookie.setMaxAge(0);
      response.addCookie(cookie);
      return ResponseEntity.status(HttpStatus.ACCEPTED).body("successfully logged out");
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
  }

  @GetMapping("/balance")
  @ResponseBody
  public ResponseEntity<?> getBalance(@CookieValue(name = JwtUtils.JWT_HEADER) String token) {
    try {
      String mail=JwtUtils.validateToken(token);
      return ResponseEntity.status(HttpStatus.ACCEPTED).body(service.getBalance(mail));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
  }

  @GetMapping("/collection")
  @ResponseBody
  public ResponseEntity<?> getUsersCollection(@CookieValue(name = JwtUtils.JWT_HEADER) String token) {
    try {
      String email=JwtUtils.validateToken(token);
      var response=service.getCollectionByEmail(email);
      return ResponseEntity.status(HttpStatus.OK).body(response);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
  }

}
