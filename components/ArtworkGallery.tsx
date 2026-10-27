"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArtworkViewer } from "./ArtworkViewer";
import { MenuMusic, type MenuMusicProps } from "./MenuMusic";
import { filterGallery, GALLERY_ART, GALLERY_CATEGORIES, GALLERY_PAGE_SIZE, type GalleryEntry } from "@/lib/art-gallery";

function GalleryCard({ art, images, onView }: { art: GalleryEntry; images: boolean; onView: (art: GalleryEntry) => void }) {
  const [failed, setFailed] = useState(false);
  return <li className="gallery-card">
    {images && <button className="gallery-image-button" type="button" data-art-src={art.src} onClick={() => onView(art)} aria-label={`View ${art.caption}`}>
      {failed ? <span>Image unavailable · open description</span> : <img src={art.small} width={art.width} height={art.height}
        alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />}
      <span className="gallery-inspect" aria-hidden="true">View artwork</span>
    </button>}
    <div className="gallery-caption"><p className="eyebrow">{art.category}</p><h3>{art.caption}</h3>
      <p>{art.description}</p></div>
  </li>;
}

export function ArtworkGallery({ artwork, music, onSettings }: { artwork: boolean; music: MenuMusicProps; onSettings: () => void }) {
  const [opened, setOpened] = useState(false), [category, setCategory] = useState("All artwork"), [query, setQuery] = useState("");
  const [page, setPage] = useState(0), [viewed, setViewed] = useState<GalleryEntry | null>(null);
  const heading = useRef<HTMLHeadingElement>(null), results = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const matches = filterGallery(category, query), pages = Math.max(1, Math.ceil(matches.length / GALLERY_PAGE_SIZE));
  const shown = matches.slice(page * GALLERY_PAGE_SIZE, (page + 1) * GALLERY_PAGE_SIZE);
  function focusResults() { results.current?.focus(); results.current?.scrollIntoView({ block: "start" }); }
  function open() { setOpened(true); requestAnimationFrame(focusResults); }
  function goPage(next: number) { setPage(next); requestAnimationFrame(focusResults); }
  return <div className="guide-screen" data-testid="artwork-gallery">
    <a className="skip" href="#gallery-reading">Skip to the artwork gallery</a>
    <header className="guide-topbar"><Link className="brand" href="/" prefetch={false}>Saint Shard <small>Kite City · 3055</small></Link>
      <div className="actions"><Link className="ghost" href="/" prefetch={false} data-testid="gallery-back">Back to main page</Link>
        <button className="ghost" type="button" onClick={onSettings}>Settings</button></div></header>
    <main className="guide-book gallery-book" id="gallery-reading" tabIndex={-1}>
      <p className="eyebrow">Painted memories of Kite City</p>
      <h1 id="gallery-title" ref={heading} tabIndex={-1}>Artwork gallery</h1>
      <p>Explore the places, people and objects of Kite City: {GALLERY_ART.length} images from across the campaign, including scene paintings, character portraits and title art.</p>
      <MenuMusic {...music} />
      {!opened ? <section className="gallery-spoilers" aria-labelledby="gallery-spoiler-title">
        <h2 id="gallery-spoiler-title">Contains story spoilers</h2>
        <p>This gallery includes later scenes, character expressions and all four endings. Browsing does not advance the story, unlock an ending or change your save.</p>
        <button className="primary" type="button" onClick={open}>Open full gallery</button>
        <p><Link href="/guide" prefetch={false}>Read the spoiler-safe field guide instead</Link></p>
      </section> : <section aria-labelledby="gallery-results-title">
        <div className="gallery-filters">
          <label>Search artwork<input type="search" value={query} maxLength={150} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Mara, chapel, rain…" /></label>
          <label>Artwork category<select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}>
            <option>All artwork</option>{GALLERY_CATEGORIES.map(name => <option key={name}>{name}</option>)}</select></label>
        </div>
        {!artwork && <p className="gallery-note">Text-only artwork is enabled. Descriptions are available below. Enable artwork in Settings to view images.</p>}
        <h2 id="gallery-results-title" ref={results} tabIndex={-1}>The collection</h2>
        <p role="status">{matches.length ? `${matches.length} matching entries · ${page * GALLERY_PAGE_SIZE + 1}–${page * GALLERY_PAGE_SIZE + shown.length} shown` : "No artwork matches. Try another search or category."}</p>
        <nav className="actions gallery-pages" aria-label="Gallery pages">
          <button className="ghost" type="button" disabled={page === 0} onClick={() => goPage(page - 1)}>Previous page</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="ghost" type="button" disabled={page + 1 >= pages} onClick={() => goPage(page + 1)}>Next page</button>
        </nav>
        <ul className="gallery-grid" data-testid="gallery-grid">{shown.map(art => <GalleryCard key={art.src} art={art} images={artwork} onView={setViewed} />)}</ul>
        {pages > 1 && <nav className="actions gallery-pages" aria-label="More gallery pages">
          <button className="ghost" type="button" disabled={page === 0} onClick={() => goPage(page - 1)}>Previous gallery page</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="ghost" type="button" disabled={page + 1 >= pages} onClick={() => goPage(page + 1)}>Next gallery page</button>
        </nav>}
      </section>}
      <p className="fine">AI-generated artwork for the original world of Saint Shard.</p>
    </main>
    {artwork && viewed && <ArtworkViewer art={viewed} onClose={() => setViewed(null)} />}
  </div>;
}
