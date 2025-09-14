package com.example.GwentMarketPlace.model.packs;

import com.example.GwentMarketPlace.model.Pack;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.CookieValue;

import java.util.List;

@Component
public class PremiumPack implements Pack {
  @Override
  public String getName() {
    return "Premium";
  }

  @Override
  public Integer getPrice() {
    return 10000;
  }

  @Override
  public List<Double> getProbabilities() {
    return List.of(40.,40.,14.,6.);
  }

  @Override
  public Integer numOfCards() {
    return 4;
  }
}
