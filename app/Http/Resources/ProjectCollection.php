<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ProjectCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total_projects' => $this->collection->count(),
                'featured_count' => $this->collection->where('featured', true)->count(),
                'categories' => $this->collection->pluck('category')->unique()->values(),
            ],
        ];
    }
}