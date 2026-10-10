<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Symptom vocabulary for the rule-based triage engine, in English plus Nigerian Pidgin,
 * Yoruba, Hausa and Igbo. All phrases are stored in normalized form (see normalize()):
 * lower-case, ASCII, no apostrophes, hyphens as spaces. Matching is substring-based.
 *
 * Safety-critical lists (breathing, unconscious, bleeding, stroke, chest) err on the side
 * of matching. Under-triage is the dangerous failure; over-triage just sends someone to
 * a clinic. Native-speaker review of the non-English entries is still needed.
 */
class TriageLexicon
{
    public static function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        // Hausa hooked letters would otherwise be dropped or mangled by ASCII folding.
        $text = strtr($text, ['ɓ' => 'b', 'ɗ' => 'd', 'ƙ' => 'k', 'ƴ' => 'y', '’' => "'", '‘' => "'"]);
        $text = Str::ascii($text);
        $text = str_replace("'", '', $text);
        $text = str_replace(['-', '_'], ' ', $text);

        return (string) preg_replace('/\s+/', ' ', $text);
    }

    /** Can't breathe / struggling to breathe. */
    public const BREATHING = [
        // EN
        'cannot breathe', 'cant breathe', 'unable to breathe', 'difficulty breathing', 'trouble breathing',
        'hard to breathe', 'struggling to breathe', 'short of breath', 'shortness of breath', 'not breathing',
        'gasping', 'breathless', 'wheezing badly',
        // PCM
        'no fit breathe', 'no fit breath', 'breath no dey come', 'breathing dey hard', 'breath dey hard',
        'wind no dey', 'dey struggle to breathe', 'dey gasp',
        // YO
        'mi o le mi', 'imi n soro', 'imi soro', 'imi ko to', 'emi n soro', 'ko ni imi', 'n gbiyanju lati mi',
        // HA
        'ba zan iya numfashi', 'ba ni iya numfashi', 'ba ya iya numfashi', 'numfashi yana wahala',
        'wahalar numfashi', 'numfashi ya kare', 'ina fama da numfashi',
        // IG
        'enweghi ike iku ume', 'enweghi m ike iku ume', 'iku ume esiri', 'iku ume na esiri', 'iku ume siri ike',
        'nsogbu iku ume',
    ];

    /** Chest / heart. */
    public const CHEST = [
        'chest', 'heart', 'pressure', 'tightness', 'palpitation',
        // PCM
        'chest dey', 'heart dey',
        // YO
        'aya mi', 'aya n dun', 'aya dun', 'okan mi', 'okan n',
        // HA
        'kirji', 'zuciya',
        // IG
        'obi m', 'obi na', 'obi nwere',
    ];

    /** Fainting, collapse, unresponsive. */
    public const UNCONSCIOUS = [
        'unconscious', 'passed out', 'pass out', 'collapsed', 'not responding', 'unresponsive', 'fainted',
        'dey faint', 'don faint', 'no dey wake', 'no dey respond',
        'daku', 'ko dahun', 'ko ji', 'ko mo nkan',
        'suma', 'ya suma', 'ta suma', 'bai farka', 'ba ya amsawa',
        'ngwuro', 'daa ngwuro', 'tufuo uche', 'o magh ihe', 'anaghi aza',
    ];

    /** Heavy bleeding. */
    public const BLEEDING = [
        'severe bleeding', 'bleeding heavily', 'heavy bleeding', 'bleeding a lot', 'blood everywhere',
        'losing a lot of blood', 'wont stop bleeding', 'cant stop the bleeding',
        'blood dey comot well', 'blood dey flow', 'blood dey pour', 'blood no dey stop',
        'eje n jade', 'eje po', 'eje ko duro', 'eje n san',
        'zubar jini', 'jini yana zuba', 'jini bai tsaya', 'jini yana fita',
        'obara na apu', 'obara na asi', 'obara anaghi akwusi', 'obara juru',
    ];

    /** Stroke / seizure / neuro red flags. */
    public const NEURO_FLAGS = [
        'slurred', 'face drooping', 'one sided weakness', 'one side of my body', 'cant move my arm', 'cant move my leg',
        'seizure', 'convuls', 'shaking uncontrollably',
        'one side of body', 'mouth no dey talk',
        'ara ko ni agbara', 'ese ko ni agbara', 'enu ya wo', 'ijagba',
        'gefe daya', 'ciwon farfadiya', 'karkarwa',
        'otu akuku', 'ogwugwu', 'nsi n ala', 'ihe nkpuchi',
    ];

    /** Phrases that make any complaint more serious. */
    public const SEVERE = [
        'severe', 'unbearable', 'crushing', 'worst', '10/10', '9/10', '8/10', 'very painful', 'extremely painful',
        'terrible', 'excruciating',
        'pain too much', 'pain dey kill', 'e dey pain me bad', 'well well pain', 'pain pass',
        'o dun mi gan', 'dun mi pupo', 'dun mi gan an', 'irora lile', 'o le gan',
        'ciwo mai tsanani', 'ciwo sosai', 'yana ciwo sosai', 'ba zan iya jurewa',
        'o na egbu m nke oma', 'mgbu siri ike', 'o na egbu m nke ukwuu', 'mgbu buru ibu',
    ];

    public const MILD = ['mild', '1/10', '2/10', '3/10', 'small small', 'small pain', 'die kere', 'kere', 'kadan', 'nwayo', 'obere'];

    /** Extra non-English category vocabulary (the English lists live in TriageEngine). */
    public const CATEGORY = [
        'FEVER' => ['body hot', 'hot body', 'iba', 'ara gbona', 'zazzabi', 'zazzabin', 'ahu oku', 'ahu m oku', 'ọkụ ahụ'],
        'GI' => ['belle', 'purge', 'inu', 'ikun', 'gbuuru', 'eebi', 'ciki', 'amai', 'zawo', 'afo', 'ogbugbo', 'afo ntuku'],
        'HEAD' => ['ori mi', 'ori n dun', 'ori dun', 'ciwon kai', 'kai na', 'isi m', 'isi na', 'isi mgbu', 'head dey'],
        'RESP' => ['ikọ', 'iko', 'ukwara', 'tari', 'kumburi'],
        'SKIN' => ['ara nyun', 'oju ara', 'kaikayi', 'fata', 'akpukpo ahu', 'akpukpo'],
        'NEURO' => ['dizzy', 'ara re', 'dimi', 'ciwon kai mai tsanani'],
        'URO' => ['ito', 'fitsari', 'mmiri ahu', 'mamiri'],
        'MUSCULO' => ['egungun', 'isẹpo', 'isepo', 'gabobi', 'kafa na', 'ukwu m', 'ogwu ukwu'],
    ];

    /** True if any phrase occurs in $text and is not directly negated ("no trouble breathing"). */
    public static function hasAny(string $text, array $phrases): bool
    {
        foreach ($phrases as $phrase) {
            $needle = self::normalize($phrase);
            if ($needle === '') {
                continue;
            }

            $offset = 0;
            while (($pos = strpos($text, $needle, $offset)) !== false) {
                if (! self::isNegated($text, $pos, $needle)) {
                    return true;
                }
                $offset = $pos + strlen($needle);
            }
        }

        return false;
    }

    /** "no / not / without / never" within the two words just before the phrase. */
    private static function isNegated(string $text, int $pos, string $needle): bool
    {
        // Phrases that already carry their own negation ("no fit breathe", "cant breathe").
        if (preg_match('/^(no|not|cant|cannot|unable|ba|ko|mi o|enweghi)\b/', $needle)) {
            return false;
        }

        $before = trim(substr($text, max(0, $pos - 24), min($pos, 24)));
        $words = preg_split('/\s+/', $before) ?: [];
        $lastTwo = array_slice($words, -2);

        foreach ($lastTwo as $word) {
            if (in_array($word, ['no', 'not', 'without', 'never', 'nothing', 'dont', 'didnt', 'rara', 'babu', 'adighi'], true)) {
                return true;
            }
        }

        return false;
    }
}
