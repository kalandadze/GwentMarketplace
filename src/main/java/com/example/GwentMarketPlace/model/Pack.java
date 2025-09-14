package com.example.GwentMarketPlace.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public interface Pack {
  default List<String> generateRarities() {
    List<String> rarities = new ArrayList<>();
    Random rand = new Random();
    for (int i = 0; i < numOfCards(); i++) {
      double dice = rand.nextDouble(100);
      double acc=0;
      if (dice < (acc+=getProbabilities().get(0))) {
        rarities.add("Common");
      }else if (dice < (acc+=getProbabilities().get(1))) {
        rarities.add("Rare");
      }else if (dice < acc + getProbabilities().get(2)) {
        rarities.add("Epic");
      }else {
        rarities.add("Legendary");
      }
    }
    return rarities;
  }

  String getName();

  Integer getPrice();

  List<Double> getProbabilities();

  Integer numOfCards();
}
