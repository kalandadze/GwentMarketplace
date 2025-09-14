package com.example.GwentMarketPlace.model.packs;

import com.example.GwentMarketPlace.model.Pack;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RarePack implements Pack {
  @Override
  public String getName() {
    return "Rare";
  }

  @Override
  public Integer getPrice() {
    return 6000;
  }

  @Override
  public List<Double> getProbabilities() {
    return List.of(20.,60.,8.,2.);
  }

  @Override
  public Integer numOfCards() {
    return 3;
  }
}
