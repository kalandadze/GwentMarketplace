package com.example.GwentMarketPlace.dto;

import com.example.GwentMarketPlace.model.Card;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserDto {
  private String username;
  private String email;
  private Long balance;
}
