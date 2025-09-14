package com.example.GwentMarketPlace.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PackDto{
  String name;
  Integer price;
  List<Double> probabilities;
  Integer numberOfCards;
}
