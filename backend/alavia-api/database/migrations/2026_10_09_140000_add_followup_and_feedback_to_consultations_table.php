<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // When Alavia should check back on the person (set when triage completes).
            $table->timestamp('follow_up_due_at')->nullable();
            $table->enum('follow_up_outcome', ['BETTER', 'SAME', 'WORSE'])->nullable();
            $table->timestamp('follow_up_at')->nullable();

            $table->boolean('feedback_helpful')->nullable();
            $table->longText('feedback_comment_encrypted')->nullable();
            $table->timestamp('feedback_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn([
                'follow_up_due_at', 'follow_up_outcome', 'follow_up_at',
                'feedback_helpful', 'feedback_comment_encrypted', 'feedback_at',
            ]);
        });
    }
};
