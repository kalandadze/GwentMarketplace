package com.example.GwentMarketPlace.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ListingDto {
  private UserDto seller;
  private CardDto card;
  private int price;
}
