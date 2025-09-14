package com.example.GwentMarketPlace.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Card {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  @ManyToOne
  CardTemplate template;
  private Integer number;
  @ManyToOne
  @JoinColumn(name = "owner")
  private User owner;
}
