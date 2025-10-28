<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'title' => $this['title'],
            'description' => $this['description'],
            'category' => $this['category'],
            'technologies' => $this['technologies'],
            'featured' => $this['featured'],
            'status' => $this['status'],
            'images' => [
                'thumbnail' => $this['images']['thumbnail'] ?? null,
                'full' => $this['images']['full'] ?? null,
                'gallery' => $this['images']['gallery'] ?? [],
            ],
            'links' => [
                'demo' => $this['links']['demo'] ?? null,
                'github' => $this['links']['github'] ?? null,
                'live' => $this['links']['live'] ?? null,
            ],
            'stats' => [
                'views' => $this['stats']['views'] ?? 0,
                'likes' => $this['stats']['likes'] ?? 0,
            ],
            'publishedAt' => $this['publishedAt'],
            'updatedAt' => $this['updatedAt'] ?? null,
        ];
    }
}