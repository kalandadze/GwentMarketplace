package com.example.GwentMarketPlace.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CardTemplateDto {
  private String name;
  private String set;
  private String category;
  private String ability;
  private String flavor;
  private String rarity;
  private String faction;
  private String type;
  private Integer power;
  private Integer provision;
  private String imageUrl;
  private String factionUrl;
}
