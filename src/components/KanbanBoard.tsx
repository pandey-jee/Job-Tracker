import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import apiClient from '../api/client';
import { Sparkles, FileText, Trash2, Target } from 'lucide-react';
import CompatibilityModal from './CompatibilityModal';

type Job = {
  id: string;
  company: string;
  role: string;
  status: string;
  date_applied: string;
  notes?: string;
};

type Props = {
  onGenerateQuestions?: (job: Job) => void;
  onGenerateCoverLetter?: (job: Job) => void;
};

const COLUMNS = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];

const STATUS_DOT: Record<string, string> = {
  Wishlist: '#64748b',
  Applied: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
};

export default function KanbanBoard({ onGenerateQuestions, onGenerateCoverLetter }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedMatchJob, setSelectedMatchJob] = useState<Job | null>(null);
  const [mobileActiveStatus, setMobileActiveStatus] = useState<string>('Wishlist');

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const handleJobAdded = () => fetchJobs();
    window.addEventListener('jobAdded', handleJobAdded);
    return () => window.removeEventListener('jobAdded', handleJobAdded);
  }, []);

  const getJobsByStatus = (status: string) => jobs.filter(job => job.status === status);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setJobs(prev => prev.map(job =>
      job.id === draggableId ? { ...job, status: destination.droppableId } : job
    ));

    try {
      await apiClient.put(`/jobs/${draggableId}`, { status: destination.droppableId });
      toast.success(`Moved to ${destination.droppableId}`);
    } catch {
      toast.error('Failed to update job status.');
      fetchJobs();
    }
  };

  const handleMoveStatus = async (jobId: string, newStatus: string) => {
    if (!newStatus) return;
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
    try {
      await apiClient.put(`/jobs/${jobId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update job status.');
      fetchJobs();
    }
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      toast.success('Job deleted successfully');
    } catch {
      toast.error('Failed to delete job application.');
    }
  };

  return (
    <>
      {/* Mobile Segmented Status Bar */}
      <div className="mobile-status-wrapper">
        <div className="mobile-status-selector">
          {COLUMNS.map(columnId => {
            const count = getJobsByStatus(columnId).length;
            const isActive = mobileActiveStatus === columnId;
            return (
              <button
                key={columnId}
                type="button"
                className={`mobile-status-tab ${isActive ? 'active' : ''}`}
                onClick={() => setMobileActiveStatus(columnId)}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: STATUS_DOT[columnId],
                    display: 'inline-block',
                  }}
                />
                <span>{columnId}</span>
                <span className="mobile-tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-container">
          {COLUMNS.map(columnId => {
            const columnJobs = getJobsByStatus(columnId);
            const isMobileActive = mobileActiveStatus === columnId;

            return (
              <div
                key={columnId}
                className={`kanban-column ${isMobileActive ? 'mobile-active' : ''}`}
              >
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: STATUS_DOT[columnId],
                        display: 'inline-block',
                      }}
                    />
                    <span>{columnId}</span>
                  </div>
                  <span className="badge">{columnJobs.length}</span>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      className="kanban-column-body"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        backgroundColor: snapshot.isDraggingOver ? 'rgba(59,130,246,0.06)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      {columnJobs.length === 0 ? (
                        <div style={{
                          border: '1px dashed var(--border-color)',
                          borderRadius: '0.5rem',
                          padding: '1.5rem 1rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.8rem',
                        }}>
                          No applications in {columnId}
                        </div>
                      ) : (
                        columnJobs.map((job, index) => (
                          <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="job-card"
                                onMouseEnter={() => setHoveredCard(job.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                style={{
                                  ...provided.draggableProps.style,
                                  boxShadow: snapshot.isDragging
                                    ? '0 12px 28px rgba(0, 0, 0, 0.7), 0 0 0 2px #3b82f6'
                                    : undefined,
                                  borderColor: snapshot.isDragging ? '#3b82f6' : undefined,
                                  cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                  zIndex: snapshot.isDragging ? 99999 : undefined,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                    {job.role}
                                  </h3>
                                  <button
                                    onClick={(e) => handleDeleteJob(job.id, e)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '0.2rem',
                                      opacity: hoveredCard === job.id ? 1 : 0.4,
                                      transition: 'opacity 0.15s',
                                    }}
                                    title="Delete application"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 500 }}>
                                  {job.company}
                                </p>

                                {job.notes && (
                                  <p style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '0.375rem',
                                    padding: '0.4rem 0.6rem',
                                    marginBottom: '0.75rem',
                                    lineHeight: 1.4,
                                  }}>
                                    {job.notes.length > 80 ? `${job.notes.substring(0, 80)}...` : job.notes}
                                  </p>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => setSelectedMatchJob(job)}
                                    className="btn btn-secondary"
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '0.25rem 0.5rem',
                                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                      borderColor: 'rgba(59, 130, 246, 0.35)',
                                      color: '#93c5fd',
                                      fontWeight: 600,
                                    }}
                                    title="Check AI Resume Match & ATS Compatibility"
                                  >
                                    <Target size={12} style={{ color: 'var(--accent-color)' }} /> Match
                                  </button>

                                  {onGenerateQuestions && (
                                    <button
                                      onClick={() => onGenerateQuestions(job)}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                                      title="AI Interview Questions"
                                    >
                                      <Sparkles size={11} /> Q&A
                                    </button>
                                  )}
                                  {onGenerateCoverLetter && (
                                    <button
                                      onClick={() => onGenerateCoverLetter(job)}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                                      title="AI Cover Letter"
                                    >
                                      <FileText size={11} /> Letter
                                    </button>
                                  )}
                                </div>

                                {/* Quick Move to Status Dropdown (Mobile Only) */}
                                <div
                                  className="mobile-status-move-select"
                                  style={{
                                    marginTop: '0.65rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.4rem',
                                  }}
                                >
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status:</span>
                                  <select
                                    value={job.status}
                                    onChange={(e) => handleMoveStatus(job.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      fontSize: '0.74rem',
                                      padding: '0.2rem 0.45rem',
                                      borderRadius: '0.35rem',
                                      backgroundColor: '#0b0e14',
                                      color: STATUS_DOT[job.status] || 'var(--text-primary)',
                                      border: '1px solid var(--border-color)',
                                      outline: 'none',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                    }}
                                    title="Move to another status"
                                  >
                                    {COLUMNS.map(col => (
                                      <option key={col} value={col} style={{ color: 'var(--text-primary)', background: '#11141c' }}>
                                        {col}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* AI Job Compatibility Modal */}
      {selectedMatchJob && (
        <CompatibilityModal
          job={selectedMatchJob}
          onClose={() => setSelectedMatchJob(null)}
        />
      )}
    </>
  );
}
