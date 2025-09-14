package com.example.GwentMarketPlace.util;

import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.model.CardTemplate;
import com.example.GwentMarketPlace.repository.CardRepository;
import com.example.GwentMarketPlace.repository.CardTemplateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component
public class GwentCardLoader implements CommandLineRunner {

  private final CardRepository cardRepository;
  private final CardTemplateRepository cardTemplateRepository;
  private final WebClient webClient;
  private final ObjectMapper objectMapper;

  @Autowired
  public GwentCardLoader(CardRepository cardRepository, CardTemplateRepository cardTemplateRepository, WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
    this.cardRepository = cardRepository;
    this.cardTemplateRepository = cardTemplateRepository;
    this.webClient = webClientBuilder.baseUrl("https://api.gwent.one").build();
    this.objectMapper = objectMapper;
  }

  @Override
  public void run(String... args) throws Exception {
    if (cardRepository.count() > 0) {
      System.out.println("Cards already loaded. Skipping.");
    } else {
      List<CardTemplate> cards = fetchAllCards();
      cards.forEach(this::saveCard);
    }
  }

  private void saveCard(CardTemplate cardTemplate) {
    int amount = 0;
    switch (cardTemplate.getRarity()) {
      case "Legendary" -> amount = 2;
      case "Epic" -> amount = 5;
      case "Rare" -> amount = 15;
      case "Common" -> amount = 40;
    }
    cardTemplateRepository.save(cardTemplate);
    for (int i = 1; i <= amount; i++) {
      Card card=new Card();
      card.setNumber(i);
      card.setTemplate(cardTemplate);
      cardRepository.save(card);
    }
  }

  public List<CardTemplate> fetchAllCards() {

    String response = webClient.get()
      .uri(uriBuilder -> uriBuilder
        .queryParam("key", "data")
        .queryParam("version", "1.0.0.15")
        .build())
      .retrieve()
      .bodyToMono(String.class)
      .block();

    List<CardTemplate> cards = new ArrayList<>();

    try {
      JsonNode root = objectMapper.readTree(response);
      JsonNode responseNode = root.get("response");

      if (responseNode != null) {
        Iterator<JsonNode> it = responseNode.elements();
        while (it.hasNext()) {
          JsonNode cardNode = it.next();
          JsonNode idNode = cardNode.path("id");
          JsonNode attrNode = cardNode.path("attributes");

          CardTemplate card = new CardTemplate();
          card.setName(cardNode.path("name").asText());
          card.setSet(cardNode.path("set").asText());
          card.setCategory(cardNode.path("category").asText());
          card.setAbility(cardNode.path("ability").asText());
          card.setFlavor(cardNode.path("flavor").asText());
          card.setRarity(attrNode.path("rarity").asText());
          card.setFaction(attrNode.path("faction").asText());
          card.setType(attrNode.path("type").asText());
          card.setPower(attrNode.path("power").asInt());
          card.setProvision(attrNode.path("provision").asInt());

          String artId = idNode.path("art").asText();
          card.setImageUrl("https://gwent.one/image/gwent/assets/card/art/medium/" + artId + ".png");
          card.setFactionUrl("https://gwent.one/img/icon/search/faction/" + card.getFaction().toLowerCase().replace(" ", "_") + ".png");

          cards.add(card);
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }

    return cards;
  }

}