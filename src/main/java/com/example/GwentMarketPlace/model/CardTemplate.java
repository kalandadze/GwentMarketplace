package com.example.GwentMarketPlace.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardTemplate {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private String name;
  @Column(name = "`set`")
  private String set;
  private String category;
  private String ability;
  @Lob
  private String flavor;
  private String rarity;
  private String faction;
  private String type;
  private Integer power;
  private Integer provision;
  private String imageUrl;
  private String factionUrl;
}
