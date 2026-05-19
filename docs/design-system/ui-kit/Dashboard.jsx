// FLEX UI kit — Dashboard screen.

const { Bike, Package, Bell, DollarSign, Calendar, Wrench, Mail,
        FileText, ShoppingCart } = window.FlexIcons;

const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function KpiCard({ icon, iconBg, iconFg = '#000', label, value, sub, pills }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.20)', borderRadius: 16,
      padding: 18, color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      flex: 1, minWidth: 0,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{
          width:32, height:32, borderRadius:'50%',
          display:'inline-flex',alignItems:'center',justifyContent:'center',
          background: iconBg, color: iconFg,
        }}>{icon}</span>
        <span style={{
          fontSize:11, fontWeight:600, letterSpacing:'0.08em',
          textTransform:'uppercase', color:'rgba(255,255,255,0.7)',
        }}>{label}</span>
      </div>
      <div className="mono" style={{ fontFamily: 'var(--font-sans)', fontSize: 30, fontWeight: 700, color: '#fff056', lineHeight: 1, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub ? <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>{sub}</div> : null}
      {pills ? <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:8}}>{pills}</div> : null}
    </div>
  );
}

function ListRow({ id, content, right, status, faded }) {
  return (
    <div className="flex center" style={{
      padding: '4px 10px', borderRadius: 10, gap: 8, fontSize: 12,
      color: faded ? 'var(--text-secondary-70)' : 'var(--dark)',
      cursor: 'pointer',
    }}>
      <span className="mono" style={{ fontWeight: 700 }}>{id}</span>
      <span className="grow truncate" style={{ color: 'var(--text-secondary-70)' }}>{content}</span>
      {right}
      {status}
    </div>
  );
}

function Dashboard({ onOpen }) {
  const now = new Date();
  const eyebrow = `${MOIS[4]} 2026`;

  return (
    <React.Fragment>
      <PageHeader
        eyebrow={eyebrow}
        title="Dashboard"
        actions={
          <div style={{display:'flex',gap:6}}>
            {['Sheets','Drive','Gmail','Contacts'].map(l => (
              <span key={l} className="outlink"><span className="dot"></span>{l}</span>
            ))}
          </div>
        }
      />

      <div className="main">
        <div className="bloc" style={{display:'grid',gap:18}}>
          {/* KPI row */}
          <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            <KpiCard
              icon={<Bike size={18}/>}
              iconBg="var(--st-on-bench-bg)"
              label="BDT actifs"
              value="9"
              pills={[
                <Pill key="rv" variant="rv">3 RV</Pill>,
                <Pill key="ev" variant="eval">1 ÉVAL.</Pill>,
                <Pill key="ap" variant="approuve">3 APPROUVÉ</Pill>,
                <Pill key="ob" variant="on-bench">2 ON BENCH</Pill>,
              ]}
            />
            <KpiCard
              icon={<Package size={18}/>}
              iconBg="var(--rouge)" iconFg="#fff"
              label="Stock à commander"
              value="129"
              sub="114 unités au total"
            />
            <KpiCard
              icon={<Bell size={18}/>}
              iconBg="var(--jaune)"
              label="Suivis"
              value="1"
              sub="1 BDT archivé à rappeler"
            />
            <KpiCard
              icon={<DollarSign size={18}/>}
              iconBg="var(--st-approuve-bg)"
              label="Revenus du mois"
              value="353,00 $"
              sub="353,00 $ BDT · 0,00 $ ventes"
            />
          </section>

          {/* 3 columns */}
          <section style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <SectionCard icon={<Calendar size={14}/>} title="Rendez-vous" count={2}>
                <ListRow id="0149" content="Julie St-Arnault · Rocky Mountain, Metro 10" status={<Pill variant="rv">RV</Pill>}/>
                <ListRow id="0148" content="Jean-Christophe Yacono · Devinci, Hatchet" status={<Pill variant="recu">REÇU</Pill>}/>
              </SectionCard>

              <SectionCard icon={<Wrench size={14}/>} title="BDT — Terminés" count={4}>
                <ListRow id="0123" content="Bonelli, Lite 1 · Louise Bacher" status={<Pill variant="facture">FACTURÉ</Pill>} faded/>
                <ListRow id="0134" content="Marin, Gestalt · Paul Lamontagne" status={<Pill variant="facture">FACTURÉ</Pill>} faded/>
                <ListRow id="0137" content="Autre · Walk-in" status={<Pill variant="facture">FACTURÉ</Pill>} faded/>
                <ListRow id="0143" content="Devinci, Hatchet · Paul Lamontagne" status={<Pill variant="facture">FACTURÉ</Pill>} faded/>
              </SectionCard>
            </div>

            <SectionCard icon={<Package size={14}/>} title="Pièces — stock épuisé" count={129}>
              <ListRow id="" content="_TEST_STOCK_" right={<span className="mono" style={{color:'var(--rouge)'}}>1</span>}/>
              <ListRow id="" content="Jagwire, Basics Road, Patins de frein" right={<span className="mono" style={{color:'var(--rouge)'}}>10</span>}/>
              <ListRow id="" content="Babac, Potence 31.8mm collet alliage argent" right={<span className="mono" style={{color:'var(--rouge)'}}>0</span>}/>
              <ListRow id="" content="Satori, Riser de potence HEADS-UP #4" right={<span className="mono" style={{color:'var(--rouge)'}}>1</span>}/>
              <ListRow id="" content="Surly, Guidon Open Bar Noir" right={<span className="mono" style={{color:'var(--rouge)'}}>1</span>}/>
              <ListRow id="" content={'Babac, Fourche 27" 1" acier chromé'} right={<span className="mono" style={{color:'var(--rouge)'}}>0</span>}/>
              <ListRow id="" content="MKS, MT-Lite, 2 pédales noires" right={<span className="mono" style={{color:'var(--rouge)'}}>0</span>}/>
              <div style={{textAlign:'center',padding:'8px 0 0',fontSize:11,color:'var(--text-secondary-60)'}}>
                + 122 autres →
              </div>
            </SectionCard>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <SectionCard icon={<FileText size={14}/>} title="Dernières factures" count={5}>
                <ListRow id="#0144" content="Etienne Mayrand · 2026-05-11" right={<span className="mono">0,00 $</span>}/>
                <ListRow id="#0135" content="Lea Abbes · 2026-05-11" right={<span className="mono">0,00 $</span>}/>
                <ListRow id="#0121" content="Etienne Mayrand · 2026-05-09" right={<span className="mono">353,00 $</span>}/>
                <ListRow id="#0138" content="Maxime Roy · 2026-05-04" right={<span className="mono">60,00 $</span>}/>
                <ListRow id="#0131" content="juliette bibasse · 2026-05-02" right={<span className="mono">18,00 $</span>}/>
              </SectionCard>

              <SectionCard icon={<ShoppingCart size={14}/>} title="Dernières ventes" count={4}>
                <ListRow id="" content="Cyclo Flex · Kenda, 700C, 20-28C" right={<span className="mono">12,95 $</span>}/>
                <ListRow id="" content="François Comeau · Jagwire CEX gaine de frein" right={<span className="mono">27,71 $</span>}/>
                <ListRow id="" content="Martin Savard · KMC, Chaînes X9" right={<span className="mono">38,85 $</span>}/>
                <ListRow id="" content="Jean-Christophe Yacono · Schwalbe Marathon" right={<span className="mono">76,00 $</span>}/>
              </SectionCard>
            </div>
          </section>
        </div>
      </div>
    </React.Fragment>
  );
}

window.Dashboard = Dashboard;
