package com.example.GwentMarketPlace.controller;

import com.example.GwentMarketPlace.dto.CardDto;
import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.repository.CardRepository;
import com.example.GwentMarketPlace.service.PackService;
import com.example.GwentMarketPlace.util.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pack")
public class PackController {
  private final PackService packService;

  public PackController(PackService packService) {
    this.packService = packService;
  }


  @GetMapping("/{packName}")
  public ResponseEntity<?> open(@PathVariable String packName,@CookieValue(name = JwtUtils.JWT_HEADER) String token) {
    try {
      String email=JwtUtils.validateToken(token);
      return ResponseEntity.ok(packService.openPack(packName,email));
    }catch (Exception e){
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
  @GetMapping
  public ResponseEntity<?> getAllPacks() {
    try {
      return ResponseEntity.ok(packService.getAllPacks());
    }catch (Exception e){
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
}
