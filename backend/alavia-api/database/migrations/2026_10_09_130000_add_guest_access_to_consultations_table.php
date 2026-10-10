<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // Guest (not signed-in) consultations have no user. Access is proven by a secret
            // token handed to the guest once; only its sha256 hash is stored here.
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('guest_token_hash', 64)->nullable()->unique()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropUnique(['guest_token_hash']);
            $table->dropColumn('guest_token_hash');
        });
    }
};
