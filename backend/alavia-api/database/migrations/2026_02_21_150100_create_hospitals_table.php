<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id();
            $table->enum('osm_type', ['node', 'way', 'relation']);
            $table->unsignedBigInteger('osm_id');
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('state')->default('Lagos');
            $table->string('lga')->nullable();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->decimal('rating', 2, 1)->nullable();
            $table->unsignedInteger('rating_count')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_24_hours')->default(false);
            $table->boolean('emergency_ready')->default(false);
            $table->timestamps();

            $table->unique(['osm_type', 'osm_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hospitals');
    }
};
