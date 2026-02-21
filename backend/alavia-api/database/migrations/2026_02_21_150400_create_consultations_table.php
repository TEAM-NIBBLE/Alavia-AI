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
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->enum('status', ['ACTIVE', 'COMPLETED'])->default('ACTIVE');
            $table->enum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])->nullable();
            $table->string('category')->nullable();
            $table->longText('summary_encrypted')->nullable();
            $table->string('recommended_specialty')->nullable();
            $table->json('first_aid_json')->nullable();
            $table->json('warnings_json')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
