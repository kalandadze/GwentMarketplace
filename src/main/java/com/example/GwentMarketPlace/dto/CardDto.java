package com.example.GwentMarketPlace.dto;

import com.example.GwentMarketPlace.model.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CardDto {
  private CardTemplateDto cardTemplate;
  private Integer number;
  private UserDto owner;
}
