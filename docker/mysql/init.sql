SET NAMES utf8mb4;

CREATE TABLE `todos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(64) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO `todos` (`title`, `description`) VALUES
('買い物に行く', '米と梅干しと麦茶を買う。'),
('米を炊く', '19:00に炊きあがるようにする。'),
('洗濯をする', '洗剤多めに入れておく');