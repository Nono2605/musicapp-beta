document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('subscription-status');
    const subscription = JSON.parse(localStorage.getItem('soundwave_subscription') || 'null');

    if (subscription && subscription.active) {
        status.innerHTML = `
            <article class="subscription-card subscription-active">
                <div class="subscription-icon"><i class="fas fa-check"></i></div>
                <div>
                    <span class="status-label">Abonnement actif</span>
                    <h3>SoundWave ${subscription.plan || 'Premium'}</h3>
                    <p>Votre formule est active${subscription.renewalDate ? ` jusqu'au ${subscription.renewalDate}` : ''}.</p>
                </div>
                <span class="status-badge">Actif</span>
            </article>
        `;
        return;
    }

    status.innerHTML = `
        <article class="subscription-card subscription-inactive">
            <div class="subscription-icon"><i class="fas fa-music"></i></div>
            <div>
                <span class="status-label">Formule actuelle</span>
                <h3>Compte gratuit</h3>
                <p>Vous écoutez SoundWave avec les fonctionnalités essentielles.</p>
                <a class="premium-cta" href="premium.html">Voir les abonnements <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;
});