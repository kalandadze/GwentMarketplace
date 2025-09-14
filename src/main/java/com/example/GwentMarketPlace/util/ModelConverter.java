package com.example.GwentMarketPlace.util;

import com.example.GwentMarketPlace.dto.*;
import com.example.GwentMarketPlace.model.*;

import java.util.List;

public class ModelConverter {

  public static List<CardDto> convertCards(List<Card> cards){
    return cards.stream().map(ModelConverter::convert).toList();
  }
  public static CardDto convert(Card card){
    return CardDto.builder()
      .cardTemplate(convert(card.getTemplate()))
      .owner(convert(card.getOwner()))
      .number(card.getNumber()).build();
  }
  public static CardTemplateDto convert(CardTemplate card){
    return CardTemplateDto.builder()
      .name(card.getName())
      .power(card.getPower())
      .ability(card.getAbility())
      .set(card.getSet())
      .type(card.getType())
      .category(card.getCategory())
      .faction(card.getFaction())
      .factionUrl(card.getFactionUrl())
      .flavor(card.getFlavor())
      .imageUrl(card.getImageUrl())
      .provision(card.getProvision())
      .rarity(card.getRarity()).build();
  }
  public static UserDto convert(User user){
    if(user == null) return null;
    return UserDto.builder()
      .username(user.getUsername())
      .email(user.getEmail())
      .balance(user.getBalance()).build();
  }
  public static ListingDto convert(Listing listing){
    return ListingDto.builder()
      .seller(convert(listing.getSeller()))
      .card(convert(listing.getCard()))
      .price(listing.getPrice())
      .build();
  }
  public static Card convert(CardTemplate template,int number,User user){
    return Card.builder()
      .number(number)
      .template(template)
      .owner(user)
      .build();
  }
  public static List<ListingDto> convertListings(List<Listing> listings){
    return listings.stream().map(ModelConverter::convert).toList();
  }
  public static PackDto convert(Pack pack){
    return PackDto.builder()
      .name(pack.getName())
      .price(pack.getPrice())
      .numberOfCards(pack.numOfCards())
      .probabilities(pack.getProbabilities())
      .build();
  }
}
