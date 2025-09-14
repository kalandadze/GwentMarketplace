package com.example.GwentMarketPlace.service;

import com.example.GwentMarketPlace.dto.CardDto;
import com.example.GwentMarketPlace.dto.CardTemplateDto;
import com.example.GwentMarketPlace.dto.PackDto;
import com.example.GwentMarketPlace.model.Card;
import com.example.GwentMarketPlace.model.CardTemplate;
import com.example.GwentMarketPlace.model.Pack;
import com.example.GwentMarketPlace.model.User;
import com.example.GwentMarketPlace.repository.CardRepository;
import static com.example.GwentMarketPlace.util.ModelConverter.*;

import com.example.GwentMarketPlace.repository.CardTemplateRepository;
import com.example.GwentMarketPlace.repository.UserRepository;
import com.example.GwentMarketPlace.util.ModelConverter;
import lombok.Builder;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
@Repository
public class PackService {
  private final CardTemplateRepository templateRepository;
  private final CardRepository cardRepository;
  private final UserRepository userRepository;
  private final List<Pack> packs;
  @Autowired
  public PackService(CardTemplateRepository templateRepository, CardRepository cardRepository, UserRepository userRepository, List<Pack> packs) {
    this.templateRepository = templateRepository;
    this.cardRepository = cardRepository;
    this.userRepository = userRepository;
    this.packs = packs;
  }

  public List<CardDto> openPack(String packName,String email) {
    User user = userRepository.findByEmail(email).orElseThrow();
    Pack pack = packs.stream().filter(pack1 -> pack1.getName().equals(packName)).findFirst().orElseThrow();
    if (user.getBalance()<pack.getPrice())throw new RuntimeException("Not enough balance for this pack");


    List<CardTemplate> cardTemplates = openPack(pack);
    List<Card> cards=cardTemplates.stream().map(cardTemplate -> convert(cardTemplate,getNumberOfCards(cardTemplate)+1,user)).toList();
    cardRepository.saveAll(cards);
    user.setBalance(user.getBalance()-pack.getPrice());
    user.getCollection().addAll(cards);
    userRepository.save(user);
    return convertCards(cards);
  }
  private int getNumberOfCards(CardTemplate card){
    return cardRepository.countCardsByTemplateName(card.getName());
  }
  private List<CardTemplate> openPack(Pack pack) {
    List<String> rarities = pack.generateRarities();
    return rarities.stream().map(this::getRandomCardByRarity).toList();
  }

  private CardTemplate getRandomCardByRarity(String rarity) {
    long count = templateRepository.countCardTemplateByRarity(rarity);

    Random random = new Random();
    int randomIndex = random.nextInt((int) count);
    PageRequest pageRequest = PageRequest.of(randomIndex, 1);

    return templateRepository.getCardTemplatesByRarity(rarity, pageRequest)
      .getContent()
      .get(0);
  }

  public List<PackDto> getAllPacks() {
    return packs.stream().map(ModelConverter::convert).toList();
  }
}
