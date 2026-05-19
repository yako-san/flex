// FLEX UI kit — Inventaire (BDT actifs, lignes pleines colorées par statut).

const { RefreshCcw, Plus } = window.FlexIcons;

const BDT_ROWS = [
  // Nouveau (RV / REÇU)
  { section: 'NOUVEAU', id: '0149', status: 'rv',         velo: 'Sélection →, …',                                   client: 'Client Test',          eval: 'Sélection →',      meca: 'Attente APPROBATION', ctrl: 'Attente MÉCANIQUE', date: '2026-05-12' },
  { section: 'NOUVEAU', id: '0148', status: 'rv',         velo: 'Sélection →, …',                                   client: 'Client Test',          eval: 'Sélection →',      meca: 'Attente APPROBATION', ctrl: 'Attente MÉCANIQUE', date: '2026-05-12' },
  { section: 'NOUVEAU', id: '0147', status: 'rv',         velo: 'Sélection →, …',                                   client: 'Client Test',          eval: 'Sélection →',      meca: 'Attente APPROBATION', ctrl: 'Attente MÉCANIQUE', date: '2026-05-12' },
  // WIP
  { section: 'WIP',     id: '0119', status: 'on-bench',   velo: 'Raleigh, Superbe, blanc, M',                       client: 'Julie Verreau Howard', eval: 'yako',             meca: 'yako',                ctrl: 'Sélection →',       date: '2026-04-22' },
  { section: 'WIP',     id: '0136', status: 'approuve',   velo: 'Autre',                                            client: 'Walk-in',              eval: 'Sélection →',      meca: 'Sélection →',         ctrl: 'Attente MÉCANIQUE', date: '2026-04-28' },
  { section: 'WIP',     id: '0146', status: 'approuve',   velo: 'Bonelli, Super Lite 600GTS, Gris, M',              client: 'Jonathan Lafrance',    eval: 'yako',             meca: 'Sélection →',         ctrl: 'Attente MÉCANIQUE', date: '2026-05-11' },
  { section: 'WIP',     id: '0145', status: 'eval',       velo: 'Rocky Mountain, Metro 10, Gris, M',                client: 'Julie St-Arnault',     eval: 'yako',             meca: 'Attente APPROBATION', ctrl: 'Attente MÉCANIQUE', date: '2026-05-11' },
  { section: 'WIP',     id: '0112', status: 'attente',    velo: 'Argon18, Subito, Kaki, XXS',                       client: 'Nathalie Therrien',    eval: 'yako',             meca: 'yako',                ctrl: 'Attente MÉCANIQUE', date: '2026-04-10' },
  { section: 'WIP',     id: '0142', status: 'attente',    velo: 'Trek, CrossTrail Disc 2016, Noir, L',              client: 'Denis McCready',       eval: 'yako',             meca: 'yako',                ctrl: 'Attente MÉCANIQUE', date: '2026-05-04' },
  // FACTURÉ
  { section: 'FACTURÉ', id: '0123', status: 'facture',    velo: 'Bonelli, Lite 1, Vert emeraude, M',                client: 'Louise Bacher',        eval: 'yako',             meca: 'yako',                ctrl: 'yako',              date: '2026-04-23' },
  { section: 'FACTURÉ', id: '0134', status: 'facture',    velo: 'Marin, Gestalt, Gris, M',                          client: 'Paul Lamontagne',      eval: 'yako',             meca: 'yako',                ctrl: 'yako',              date: '2026-04-28' },
  { section: 'FACTURÉ', id: '0137', status: 'facture',    velo: 'Autre, 🚨 Urgent. : Flat (15,5+13$)',              client: 'Walk-in',              eval: 'Sélection →',      meca: 'Sélection →',         ctrl: 'Sélection →',       date: '2026-04-29' },
  { section: 'FACTURÉ', id: '0143', status: 'facture',    velo: 'Devinci, Hatchet, Noir, M',                        client: 'Paul Lamontagne',      eval: 'yako',             meca: 'Sélection →',         ctrl: 'Sélection →',       date: '2026-05-06' },
  // STAFF
  { section: 'STAFF',   id: '0110', status: 'on-bench',   velo: 'Vélomane, Cabalero, noir, L.',                     client: 'Jean-Christophe Yacono', eval: 'yako',           meca: 'yako',                ctrl: 'Sélection →',       date: '2026-04-09', staff: true },
  { section: 'STAFF',   id: '0116', status: 'approuve',   velo: 'Trek, FX2, Antracite, XL',                         client: 'Jean-Christophe Yacono', eval: 'yako',           meca: 'Sélection →',         ctrl: 'Attente MÉCANIQUE', date: '2026-04-17', staff: true },
];

const STATUS_LABEL = {
  rv: 'RV', recu: 'REÇU', eval: 'ÉVAL.', attente: 'EN ATTENTE',
  approuve: 'APPROUVÉ', 'on-bench': 'ON BENCH', 'ctrl-qlte': 'CTRL QLTÉ',
  fini: 'FINI', facturer: 'FACTURER', facture: 'FACTURÉ', livre: 'LIVRÉ',
};

const STATUS_BG = {
  rv:'#fff056', recu:'#fff056', eval:'#88fa4e', attente:'#fb923c',
  approuve:'#62e335','on-bench':'#5cd62b','ctrl-qlte':'#2e7d32',
  fini:'#fce4ec', facturer:'#e53935', facture:'#ffcdd2', livre:'#e0e0e0',
};
const STATUS_FG = {
  rv:'#000', recu:'#000', eval:'#000', attente:'#000', approuve:'#000',
  'on-bench':'#000','ctrl-qlte':'#fff', fini:'#c62828', facturer:'#fff',
  facture:'#b71c1c', livre:'#333',
};

function Row({ r, onOpen }) {
  const bg = STATUS_BG[r.status];
  const fg = STATUS_FG[r.status];
  const cellStyle = {
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
  };
  return (
    <div
      onClick={() => onOpen?.(r.id)}
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1.6fr 180px 130px 130px 130px 110px',
        gap: 12, alignItems: 'center',
        padding: '10px 14px', borderRadius: 999,
        background: bg, color: fg, cursor: 'pointer',
        fontSize: 13, marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{r.id}</span>
        <Pill variant={r.status}>{STATUS_LABEL[r.status]}</Pill>
        {r.staff ? <Pill variant="staff">STAFF</Pill> : null}
      </div>
      <span style={{ ...cellStyle, fontWeight: 500 }}>{r.velo}</span>
      <span style={cellStyle}>{r.client} <span style={{opacity:0.5}}>▾</span></span>
      <span style={{ ...cellStyle, opacity: 0.85 }}>{r.eval}</span>
      <span style={{ ...cellStyle, opacity: 0.85 }}>{r.meca}</span>
      <span style={{ ...cellStyle, opacity: 0.85 }}>{r.ctrl}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'center', whiteSpace: 'nowrap' }}>{r.date}</span>
    </div>
  );
}

function Inventaire({ onOpen }) {
  const sections = ['NOUVEAU','WIP','FACTURÉ','STAFF'];

  return (
    <React.Fragment>
      <PageHeader
        eyebrow="vélos en atelier"
        title="Inventaire"
        hint="Cliquer un BDT pour ouvrir la fiche"
        actions={
          <div style={{display:'flex',gap:8}}>
            <IconButton tone="utilDark" ariaLabel="rafraîchir"><RefreshCcw size={16}/></IconButton>
            <AddButton ariaLabel="nouveau BDT"/>
          </div>
        }
      />

      <div className="main">
        <div className="bloc">
          {/* Header row */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'140px 1.6fr 180px 130px 130px 130px 110px',
            gap: 12, padding: '6px 14px',
            background: 'rgba(255,255,255,0.5)', borderRadius: 999,
            fontSize: 11, fontWeight: 600, textTransform: 'lowercase',
            color: 'var(--text-secondary-60)', marginBottom: 4,
          }}>
            <span>bons de travail →</span>
            <span>vélos →</span>
            <span>clients →</span>
            <span>évaluation →</span>
            <span>mécanique →</span>
            <span>contrôle →</span>
            <span>date in</span>
          </div>

          {sections.map(sec => {
            const rows = BDT_ROWS.filter(r => r.section === sec);
            return (
              <React.Fragment key={sec}>
                <div style={{
                  fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.6)',
                  textTransform:'uppercase', letterSpacing:'0.1em',
                  padding:'8px 14px 4px',
                }}>{sec}</div>
                {rows.map(r => <Row key={r.id} r={r} onOpen={onOpen}/>)}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}

window.Inventaire = Inventaire;
