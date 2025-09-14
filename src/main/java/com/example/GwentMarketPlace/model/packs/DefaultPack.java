package com.example.GwentMarketPlace.model.packs;

import com.example.GwentMarketPlace.model.Pack;
import org.springframework.stereotype.Component;

import java.util.List;
@Component
public class DefaultPack implements Pack {
  @Override
  public String getName() {
    return "Default";
  }

  @Override
  public Integer getPrice() {
    return 3000;
  }

  @Override
  public List<Double> getProbabilities() {
    return List.of(65.,25.,8.,2.);
  }

  @Override
  public Integer numOfCards() {
    return 3;
  }
}
