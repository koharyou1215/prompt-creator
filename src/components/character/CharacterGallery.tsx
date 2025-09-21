'use client';

import { useState, useEffect } from 'react';
import {
  Search, Plus, Grid, List, Filter, Edit,
  Trash2, Star, StarOff, Eye, Copy, Upload, Download
} from 'lucide-react';
import { useCharacterStore } from '@/stores/characterStore';
import Image from 'next/image';

interface Character {
  id: string;
  name: string;
  description: string;
  appearance: {
    hair: string;
    eyes: string;
    outfit: string;
    accessories?: string;
    physique?: string;
  };
  personality?: string;
  background?: string;
  tags: string[];
  referenceImages: string[];
  prompts: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CharacterGalleryProps {
  onCharacterSelect?: (character: Character) => void;
  onCharacterEdit?: (character: Character) => void;
}

export function CharacterGallery({
  onCharacterSelect,
  onCharacterEdit
}: CharacterGalleryProps) {
  const {
    characters,
    filteredCharacters,
    searchQuery,
    viewMode,
    loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    toggleFavorite,
    extractFromPrompt,
    setSearchQuery,
    setViewMode
  } = useCharacterStore();

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'date'>('usage');

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const getAllTags = () => {
    const tagSet = new Set<string>();
    characters.forEach(char => {
      char.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setShowDetailModal(true);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };

  const handleToggleFavorite = async (characterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(characterId);
  };

  const handleDeleteCharacter = async (characterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このキャラクターを削除しますか？')) {
      await deleteCharacter(characterId);
    }
  };

  const handleEditCharacter = (character: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCharacterEdit) {
      onCharacterEdit(character);
    }
  };

  const handleExtractFromPrompt = async (promptText: string) => {
    const extractedCharacter = await extractFromPrompt(promptText);
    if (extractedCharacter) {
      setSelectedCharacter(extractedCharacter);
      setShowCreateModal(false);
      setShowDetailModal(true);
    }
  };

  const getSortedCharacters = () => {
    let filtered = filteredCharacters;

    if (filterTags.length > 0) {
      filtered = filtered.filter(char =>
        filterTags.every(tag => char.tags.includes(tag))
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  };

  const renderCharacterCard = (character: Character) => (
    <div
      key={character.id}
      onClick={() => handleCharacterClick(character)}
      className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Character Image */}
      <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 relative">
        {character.referenceImages.length > 0 ? (
          <Image
            src={character.referenceImages[0]}
            alt={character.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-6xl font-bold text-purple-300">
              {character.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => handleToggleFavorite(character.id, e)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
        >
          {character.isFavorite ? (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          ) : (
            <StarOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Character Info */}
      <div className="p-4">
        <h4 className="font-semibold text-lg mb-1">{character.name}</h4>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {character.description}
        </p>

        {/* Appearance Summary */}
        <div className="space-y-1 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">髪:</span>
            <span>{character.appearance.hair}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">瞳:</span>
            <span>{character.appearance.eyes}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">衣装:</span>
            <span className="line-clamp-1">{character.appearance.outfit}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {character.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {character.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{character.tags.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>使用: {character.usageCount}回</span>
          <span>{character.prompts.length} プロンプト</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t">
          <button
            onClick={(e) => handleEditCharacter(character, e)}
            className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center gap-1"
          >
            <Edit className="w-3 h-3" />
            編集
          </button>
          <button
            className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center gap-1"
          >
            <Copy className="w-3 h-3" />
            複製
          </button>
          <button
            onClick={(e) => handleDeleteCharacter(character.id, e)}
            className="flex-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            削除
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="キャラクター検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Filter Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">タグフィルター</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {getAllTags().map(tag => (
                <label key={tag} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilterTags([...filterTags, tag]);
                      } else {
                        setFilterTags(filterTags.filter(t => t !== tag));
                      }
                    }}
                    className="w-3 h-3"
                  />
                  <span className="text-sm text-gray-600">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">並び順</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="usage">使用頻度順</option>
              <option value="name">名前順</option>
              <option value="date">更新日順</option>
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新規キャラクター
            </button>

            <button className="w-full py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              プロンプトから抽出
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">キャラクターギャラリー</h2>
            <span className="text-sm text-gray-500">
              {getSortedCharacters().length}体
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {getSortedCharacters().map(renderCharacterCard)}
            </div>
          ) : (
            <div className="space-y-4">
              {getSortedCharacters().map(character => (
                <div
                  key={character.id}
                  onClick={() => handleCharacterClick(character)}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden flex-shrink-0">
                      {character.referenceImages.length > 0 ? (
                        <Image
                          src={character.referenceImages[0]}
                          alt={character.name}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-3xl font-bold text-purple-300">
                            {character.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{character.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {character.description}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleToggleFavorite(character.id, e)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          {character.isFavorite ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Details */}
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        <span>髪: {character.appearance.hair}</span>
                        <span>瞳: {character.appearance.eyes}</span>
                        <span>使用: {character.usageCount}回</span>
                      </div>

                      {/* Tags */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {character.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEditCharacter(character, e)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCharacter(character.id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}