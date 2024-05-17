<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $posts = Post::all();
        return view('posts.index', compact('posts'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return;
        return view('posts.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        return;
        $post = new Post;
        $post->title = $request->title;
        $post->content = $request->content;
        $post->author = $request->author;
        $post->save();

        return redirect('/posts');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post)
    {
        return view('posts.show', compact('post'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Post $post)
    {
        return;
        return view('posts.edit', compact('post'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post)
    {
        return;
        $post->title = $request->title;
        $post->content = $request->content;
        $post->author = $request->author;
        $post->save();

        return redirect('/posts');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        return;
        $post->delete();
        return redirect('/posts');
    }
}