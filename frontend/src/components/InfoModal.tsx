import { Box, Typography, Label, TextLink, Flex, Tabs, LoadingSpinner } from '@neo4j-ndl/react';
import { DocumentTextIconOutline } from '@neo4j-ndl/react/icons';
import '../styling/info.css';
import Neo4jRetrievalLogo from '../assets/images/Neo4jRetrievalLogo.png';
import wikipedialogo from '../assets/images/Wikipedia-logo-v2.svg';
import youtubelogo from '../assets/images/youtube.png';
import { LabelColors, UserCredentials, chatInfoMessage } from '../types';
import { useEffect, useMemo, useRef, useState } from 'react';
import HoverableLink from './HoverableLink';
import GraphViewButton from './GraphViewButton';
import { chunkEntitiesAPI } from '../services/ChunkEntitiesInfo';
import { useCredentials } from '../context/UserCredentials';

type Entity = {
  element_id: string;
  labels: string[];
  properties: {
    id: string;
  };
};

type GroupedEntity = {
  texts: Set<string>;
  color: LabelColors;
};
const labelColors: LabelColors[] = ['default', 'success', 'info', 'warning', 'danger', undefined];

const parseEntity = (entity: Entity) => {
  const { labels, properties } = entity;
  const label = labels[0];
  const text = properties.id;
  return { label, text };
};
const InfoModal: React.FC<chatInfoMessage> = ({ sources, model, total_tokens, response_time, chunk_ids }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [infoEntities, setInfoEntities] = useState<Entity[]>([]);
  const [loading, setIsloading] = useState<boolean>(false);
  const { userCredentials } = useCredentials();
  const labelColourMap = useRef<{ [key: string]: LabelColors }>({});

  useEffect(() => {
    if (activeTab === 1) {
      setIsloading(true);
      chunkEntitiesAPI(userCredentials as UserCredentials, chunk_ids.join(','))
        .then((response) => {
          setInfoEntities(response.data.data.nodes);
          setIsloading(false);
        })
        .catch((error) => {
          console.error('Error fetching entities:', error);
          setIsloading(false);
        });
    }
  }, [activeTab, chunk_ids]);

  const groupedEntities = useMemo<{ [key: string]: GroupedEntity }>(() => {
    return infoEntities.slice(0, 6).reduce((acc, entity) => {
      const { label, text } = parseEntity(entity);
      if (!acc[label]) {
        const newColor = labelColourMap.current[label] ?? labelColors[Math.floor(Math.random() * labelColors.length)];
        labelColourMap.current[label] = newColor;
        acc[label] = { texts: new Set(), color: newColor };
      }
      acc[label].texts.add(text);
      return acc;
    }, {} as Record<string, { texts: Set<string>; color: LabelColors }>);
  }, [infoEntities]);

  const onChangeTabs = async (e: any) => {
    setActiveTab(e);
  };

  return (
    <Box className='n-bg-palette-neutral-bg-weak p-4'>
      <Box className='flex flex-row pb-6 items-center mb-2'>
        <img src={Neo4jRetrievalLogo} alt='icon' style={{ width: 95, height: 95, marginRight: 10 }} />
        <Box className='flex flex-col'>
          <Typography variant='h2'>Retrieval information</Typography>
          <Typography variant='body-medium' sx={{ mb: 2 }}>
            To generate this response, in <span className='font-bold'>{response_time.toFixed(2)} seconds</span> we used{' '}
            <span className='font-bold'>{total_tokens}</span> tokens with the model{' '}
            <span className='font-bold'>{model}</span>.
          </Typography>
        </Box>
      </Box>
      <Tabs size='large' fill='underline' onChange={onChangeTabs} value={activeTab}>
        <Tabs.Tab tabId={0}>Sources used</Tabs.Tab>
        <Tabs.Tab tabId={1}>Entities used</Tabs.Tab>
      </Tabs>
      <Flex className='p-6'>
        {activeTab === 0 ? (
          sources.length > 0 ? (
            <ul className='list-none'>
              {sources.map((link, index) => (
                <li key={index}>
                  {link.source_name.startsWith('http') || link.source_name.startsWith('https') ? (
                    <div className='flex flex-row inline-block justiy-between items-center p8'>
                      {link.source_name.includes('wikipedia.org') ? (
                        <img src={wikipedialogo} width={20} height={20} className='mr-2' />
                      ) : (
                        <img src={youtubelogo} width={20} height={20} className='mr-2' />
                      )}
                      <TextLink href={link.source_name} externalLink={true}>
                        {link.source_name.includes('wikipedia.org') ? (
                          <>
                            <HoverableLink url={link.source_name}>
                              <Typography variant='body-medium'>Wikipedia</Typography>
                              <Typography variant='body-small' className='italic'>
                                {' '}
                                - Section {total_tokens}
                              </Typography>
                            </HoverableLink>
                          </>
                        ) : (
                          <>
                            <HoverableLink url={link.source_name}>
                              <Typography variant='body-medium'>YouTube</Typography>
                              <Typography variant='body-small' className='italic'>
                                - 00:01:24 - 00:01:32
                              </Typography>
                            </HoverableLink>
                          </>
                        )}
                      </TextLink>
                    </div>
                  ) : (
                    <div className='flex flex-row inline-block justiy-between items-center'>
                      <DocumentTextIconOutline className='n-size-token-7 mr-2' />
                      <Typography
                        variant='body-medium'
                        className='text-ellipsis whitespace-nowrap max-w-[calc(100%-100px)] overflow-hidden'
                      >
                        {link.source_name}
                      </Typography>
                      {link.page_numbers.length > 0 ? (
                        <Typography variant='body-small' className='italic'>
                          {' '}
                          - Page {link.page_numbers.join(', ')}
                        </Typography>
                      ) : (
                        <></>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant='body-large'>No sources found</Typography>
          )
        ) : loading ? ( // Show loader while loading
          <Box className='flex justify-center items-center'>
            <LoadingSpinner size='small' />
          </Box>
        ) : Object.keys(groupedEntities).length > 0 ? (
          <ul className='list-none'>
            {Object.keys(groupedEntities).map((label, index) => (
              <li
                key={index}
                className='flex items-center mb-2'
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
              >
                <Label color={groupedEntities[label].color} fill='semi-filled' className='entity-label mr-2'>
                  {label}
                </Label>
                <Typography
                  className='entity-text'
                  variant='body-medium'
                  sx={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 'calc(100% - 120px)',
                  }}
                >
                  {Array.from(groupedEntities[label].texts).join(', ')}
                </Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant='body-large'>No entities found</Typography>
        )}
      </Flex>
      {activeTab === 1 && (
        <Box className='button-container flex mt-2'>
          <GraphViewButton chunk_ids={chunk_ids.join(',')} />
        </Box>
      )}
    </Box>
  );
};
export default InfoModal;