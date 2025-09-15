package com.example.GwentMarketPlace.controller;

import com.example.GwentMarketPlace.dto.ListingDto;
import com.example.GwentMarketPlace.service.GwentService;
import com.example.GwentMarketPlace.util.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/cards")
public class GwentController {
  private final GwentService gwentService;
  @Autowired
  public GwentController(GwentService gwentService) {
    this.gwentService = gwentService;
  }

  @GetMapping("/templates")
  public ResponseEntity<?> getCardTemplates(@RequestParam(defaultValue = "1000") Integer size,
                                            @RequestParam(defaultValue = "0") Integer page,
                                            @RequestParam(defaultValue = "name") GwentService.sortBy sortBy,
                                            @RequestParam(required = false) List<Rarity> rarities,
                                            @RequestParam(required = false) Faction faction,
                                            @RequestParam(required = false) List<Type> types,
                                            @RequestParam(defaultValue = "0") Integer minPower,
                                            @RequestParam(defaultValue = "15") Integer maxPower) {
    try {
      return ResponseEntity.ok(gwentService.getUniqueCardsWithCountByPageAndSortBy(size, page, sortBy,rarities,faction,types,minPower,maxPower));
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @GetMapping("/templates/{templateId}")
  public ResponseEntity<?> getACardTemplate(@PathVariable("templateId") Long templateId) {
    try {
      return ResponseEntity.ok(gwentService.getTemplate(templateId));
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @GetMapping
  public ResponseEntity<?> getAllCards(@RequestParam String name) {
    try {
      return ResponseEntity.ok(gwentService.getAllCardsByName(name));
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @GetMapping("/listings/{cardName}")
  public ResponseEntity<?> getCardListings(@PathVariable String cardName) {
    try {
      List<ListingDto> listings=gwentService.getListingsByName(cardName);
      return ResponseEntity.ok(listings);
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PostMapping("/list/{cardName}/{number}")
  public ResponseEntity<?> listCard(@CookieValue(name = JwtUtils.JWT_HEADER) String token,@PathVariable String cardName,@PathVariable Integer number,@RequestParam("price") Integer price) {
    try {
      System.out.println(cardName);
      String email=JwtUtils.validateToken(token);
      gwentService.sellCard(email,cardName,number,price);
      return ResponseEntity.ok("Card successfully listed");
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PostMapping("/quicksell/{cardName}/{number}")
  public ResponseEntity<?> quicksell(@CookieValue(name = JwtUtils.JWT_HEADER) String token,@PathVariable String cardName,@PathVariable Integer number) {
    try {
      System.out.println(cardName);
      String email=JwtUtils.validateToken(token);
      gwentService.quicksell(email,cardName,number);
      return ResponseEntity.ok("Card successfully listed");
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PutMapping("/buy/{cardName}/{number}")
  public ResponseEntity<?> buyCard(@CookieValue(name = JwtUtils.JWT_HEADER) String token,@PathVariable String cardName,@PathVariable Integer number) {
    try {
      String email=JwtUtils.validateToken(token);
      gwentService.buyCard(email,cardName,number);
      return ResponseEntity.ok("Card bought successfully");
    }catch (Exception e){
      log.error(e.getMessage());
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  public enum Rarity {
    Common,
    Rare,
    Epic,
    Legendary
  }

  public enum Type {
    Unit,
    Special,
    Artifact,
    Ability
  }

  public enum Faction {
    NorthernRealms,
    Nilfgaard,
    Monsters,
    Scoiatel,
    Skellige


  }
}


