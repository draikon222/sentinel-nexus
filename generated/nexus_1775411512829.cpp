#include <immintrin.h>
#include <iostream>

void proceseazaArray(float* date, int dimensiune) {
    // Verificăm dacă numărul total de elemente este divizibil cu 8
    int numerePeVector = dimensiune / 8;
    int rest = dimensiune % 8;

    // Declaram un vector AVX pentru a procesa 8 elemente simultan
    __m256 vData;

    // Procesăm vectorii AVX
    for (int i = 0; i < numerePeVector; i++) {
        // Încarcăm 8 elemente în vectorul AVX
        vData = _mm256_loadu_ps(&date[i * 8]);

        // Aplicăm operația de procesare (în acest caz, adunarea)
        vData = _mm256_add_ps(vData, _mm256_set1_ps(1.0f));

        // Stocăm rezultatul în vectorul AVX
        _mm256_storeu_ps(&date[i * 8], vData);
    }

    // Procesăm restul de elemente
    if (rest > 0) {
        // Încarcăm restul de elemente în vectorul AVX
        vData = _mm256_loadu_ps(&date[numerePeVector * 8]);

        // Aplicăm operația de procesare (în acest caz, adunarea)
        vData = _mm256_add_ps(vData, _mm256_set1_ps(1.0f));

        // Stocăm rezultatul în vectorul AVX
        _mm256_storeu_ps(&date[numerePeVector * 8], vData);

        // Folosim un scalar tail-loop pentru elementele rămase
        for (int i = 0; i < rest; i++) {
            date[numerePeVector * 8 + i] += 1.0f;
        }
    }
}

int main() {
    alignas(32) float date[1000000];
    proceseazaArray(date, 1000000);
    return 0;
}
